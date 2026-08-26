<?php

namespace App\Http\Controllers\ApiInspector;

use App\Http\Controllers\Controller;
use App\Models\ApiMonitor;
use App\Models\ApiMonitorSecretAudit;
use App\Services\Security\MonitorSecretAuditPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MonitorSecretAuditController extends Controller
{
    public function __construct(
        private readonly MonitorSecretAuditPresenter $presenter,
    ) {}

    public function index(Request $request, ApiMonitor $apiMonitor): Response
    {
        Gate::authorize('view', $apiMonitor);

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
        ]);
    }
}
