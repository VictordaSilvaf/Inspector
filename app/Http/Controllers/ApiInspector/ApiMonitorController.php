<?php

namespace App\Http\Controllers\ApiInspector;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiInspector\StoreApiMonitorRequest;
use App\Http\Requests\ApiInspector\UpdateApiMonitorRequest;
use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Services\ApiMonitorChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApiMonitorController extends Controller
{
    public function index(Request $request): Response
    {
        $monitors = $request->user()
            ->apiMonitors()
            ->latest()
            ->get()
            ->map(fn (ApiMonitor $monitor): array => $monitor->toFrontendArray());

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
        $monitor = $request->user()->apiMonitors()->create($request->validated());

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

        $checks = Inertia::scroll(
            fn () => $apiMonitor->checks()
                ->latest('checked_at')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (ApiMonitorCheck $check): array => $check->toFrontendArray()),
        );

        return Inertia::render('ApiInspector/show', [
            'monitor' => $apiMonitor->toDetailArray(),
            'checks' => $checks,
        ]);
    }

    public function update(
        UpdateApiMonitorRequest $request,
        ApiMonitor $apiMonitor,
    ): RedirectResponse {
        $apiMonitor->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Monitor atualizado com sucesso.'),
        ]);

        return to_route('api-inspector.show', $apiMonitor);
    }
}
