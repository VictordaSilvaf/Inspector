<?php

namespace App\Http\Controllers\ApiInspector;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiInspector\StoreApiMonitorRequest;
use App\Http\Requests\ApiInspector\UpdateApiMonitorRequest;
use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Services\ApiMonitorChecker;
use App\Services\ApiMonitorPersistenceService;
use App\Services\Billing\PlanLimitsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApiMonitorController extends Controller
{
    public function __construct(
        private readonly ApiMonitorPersistenceService $persistence,
    ) {}

    public function index(Request $request): Response
    {
        $monitors = $request->user()
            ->apiMonitors()
            ->with('headers')
            ->latest()
            ->get()
            ->map(fn (ApiMonitor $monitor): array => $this->persistence->toFrontendArray($monitor));

        return Inertia::render('ApiInspector/index', [
            'monitors' => $monitors,
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $monitors = $request->user()
            ->apiMonitors()
            ->orderByDesc('id')
            ->get()
            ->map(fn (ApiMonitor $monitor): array => $monitor->toStatusArray());

        return response()->json([
            'monitors' => $monitors,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ApiInspector/create');
    }

    public function store(
        StoreApiMonitorRequest $request,
        ApiMonitorChecker $checker,
    ): RedirectResponse {
        $result = $this->persistence->createFromStoreRequest($request);
        $monitor = $result['monitor'];

        $checker->check($monitor, 'manual');

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Monitor criado com sucesso.'),
        ]);

        return to_route('api-inspector.index');
    }

    public function show(Request $request, ApiMonitor $apiMonitor): Response
    {
        Gate::authorize('view', $apiMonitor);

        $apiMonitor->load(['secret', 'headers']);

        $limits = app(PlanLimitsService::class)->forUser($request->user());
        $historySince = now()->subDays($limits->historyRetentionDays);

        $checks = Inertia::scroll(
            fn () => $apiMonitor->checks()
                ->where('checked_at', '>=', $historySince)
                ->latest('checked_at')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (ApiMonitorCheck $check): array => $check->toFrontendArray()),
        );

        return Inertia::render('ApiInspector/show', [
            'monitor' => $this->persistence->toEditableArray($apiMonitor),
            'checks' => $checks,
            'historyRetentionDays' => $limits->historyRetentionDays,
            'canAccessCredentialAudit' => $limits->credentialAudit,
        ]);
    }

    public function update(
        UpdateApiMonitorRequest $request,
        ApiMonitor $apiMonitor,
    ): RedirectResponse {
        $this->persistence->updateFromRequest($request, $apiMonitor);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Monitor atualizado com sucesso.'),
        ]);

        return to_route('api-inspector.show', $apiMonitor);
    }
}
