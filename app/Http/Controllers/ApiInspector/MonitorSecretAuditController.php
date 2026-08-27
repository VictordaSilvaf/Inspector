<?php

namespace App\Http\Controllers\ApiInspector;

use App\Http\Controllers\Controller;
use App\Models\ApiMonitor;
use App\Models\ApiMonitorSecretAudit;
use App\Services\Billing\PlanLimitsService;
use App\Services\Security\MonitorSecretAuditPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MonitorSecretAuditController extends Controller
{
    public function __construct(
        private readonly MonitorSecretAuditPresenter $presenter,
        private readonly PlanLimitsService $planLimits,
    ) {}

    public function index(Request $request, ApiMonitor $apiMonitor): Response
    {
        Gate::authorize('view', $apiMonitor);

        $limits = $this->planLimits->forUser($request->user());

        abort_unless($limits->credentialAudit, 403, 'Auditoria de credenciais não disponível no seu plano.');

        $audits = Inertia::scroll(
            fn () => $apiMonitor->secretAudits()
                ->with('user')
                ->latest('created_at')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (ApiMonitorSecretAudit $audit): array => $this->presenter->toFrontendArray($audit)),
        );

        return Inertia::render('ApiInspector/audit', [
            'monitor' => [
                'id' => $apiMonitor->id,
                'name' => $apiMonitor->name,
                'url' => $apiMonitor->url,
            ],
            'audits' => $audits,
            'canExportAudit' => $limits->credentialAuditExport,
        ]);
    }

    public function export(Request $request, ApiMonitor $apiMonitor): StreamedResponse
    {
        Gate::authorize('view', $apiMonitor);

        $limits = $this->planLimits->forUser($request->user());

        abort_unless($limits->credentialAuditExport, 403, 'Exportação de auditoria disponível no plano Business.');

        $filename = sprintf('monitor-%d-credential-audit.csv', $apiMonitor->id);

        return response()->streamDownload(function () use ($apiMonitor): void {
            $handle = fopen('php://output', 'wb');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['id', 'action', 'actor', 'ip_address', 'metadata', 'created_at']);

            $apiMonitor->secretAudits()
                ->with('user')
                ->latest('created_at')
                ->lazy()
                ->each(function (ApiMonitorSecretAudit $audit) use ($handle): void {
                    fputcsv($handle, [
                        $audit->id,
                        $this->presenter->actionLabel($audit->action),
                        $audit->user?->email ?? 'system',
                        $audit->ip_address,
                        json_encode($audit->metadata ?? [], JSON_THROW_ON_ERROR),
                        $audit->created_at?->toIso8601String(),
                    ]);
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
