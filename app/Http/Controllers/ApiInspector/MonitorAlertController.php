<?php

namespace App\Http\Controllers\ApiInspector;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApiInspector\StoreMonitorAlertRequest;
use App\Http\Requests\ApiInspector\SyncMonitorAlertSubscriptionsRequest;
use App\Models\AlertSubscription;
use App\Models\ApiMonitor;
use App\Models\MonitorAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MonitorAlertController extends Controller
{
    public function index(Request $request, ApiMonitor $apiMonitor): Response
    {
        Gate::authorize('view', $apiMonitor);

        return Inertia::render('ApiInspector/alerts', [
            'monitor' => [
                'id' => $apiMonitor->id,
                'name' => $apiMonitor->name,
                'url' => $apiMonitor->url,
            ],
            'alerts' => $apiMonitor->alerts()
                ->with(['subscriptions.notificationChannel'])
                ->latest()
                ->get()
                ->map(fn (MonitorAlert $alert): array => $alert->toFrontendArray()),
            'notificationChannels' => $request->user()
                ->notificationChannels()
                ->where('verification_status', 'verified')
                ->where('is_active', true)
                ->latest()
                ->get()
                ->map(fn ($channel): array => $channel->toFrontendArray()),
        ]);
    }

    public function store(
        StoreMonitorAlertRequest $request,
        ApiMonitor $apiMonitor,
    ): RedirectResponse {
        Gate::authorize('view', $apiMonitor);

        $validated = $request->validated();

        $alert = $apiMonitor->alerts()->create([
            'name' => $validated['name'] ?? null,
            'type' => $validated['type'],
            'operator' => $validated['operator'],
            'value' => $validated['value'],
            'cooldown_seconds' => $validated['cooldown_seconds'] ?? 300,
        ]);

        $this->applySubscriptionChannelIds(
            $alert,
            $validated['notification_channel_ids'] ?? [],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Alerta criado com sucesso.'),
        ]);

        return to_route('api-inspector.alerts.index', $apiMonitor);
    }

    public function destroy(ApiMonitor $apiMonitor, MonitorAlert $monitorAlert): RedirectResponse
    {
        Gate::authorize('view', $apiMonitor);
        Gate::authorize('delete', $monitorAlert);

        abort_unless($monitorAlert->api_monitor_id === $apiMonitor->id, 404);

        $monitorAlert->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Alerta removido.'),
        ]);

        return to_route('api-inspector.alerts.index', $apiMonitor);
    }

    public function syncSubscriptions(
        SyncMonitorAlertSubscriptionsRequest $request,
        ApiMonitor $apiMonitor,
        MonitorAlert $monitorAlert,
    ): RedirectResponse {
        Gate::authorize('view', $apiMonitor);
        abort_unless($monitorAlert->api_monitor_id === $apiMonitor->id, 404);

        $this->applySubscriptionChannelIds(
            $monitorAlert,
            $request->validated('notification_channel_ids'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Destinatários atualizados.'),
        ]);

        return to_route('api-inspector.alerts.index', $apiMonitor);
    }

    /**
     * @param  array<int, int|string>  $channelIds
     */
    private function applySubscriptionChannelIds(MonitorAlert $alert, array $channelIds): void
    {
        $channelIds = collect($channelIds)->map(fn ($id): int => (int) $id)->unique()->values();

        $existing = $alert->subscriptions()->get()->keyBy('notification_channel_id');

        foreach ($channelIds as $channelId) {
            $subscription = $existing->get($channelId);

            if ($subscription instanceof AlertSubscription) {
                $subscription->update([
                    'is_active' => true,
                    'unsubscribed_at' => null,
                ]);

                continue;
            }

            $alert->subscriptions()->create([
                'notification_channel_id' => $channelId,
                'unsubscribe_token' => Str::random(64),
                'is_active' => true,
            ]);
        }

        $alert->subscriptions()
            ->whereNotIn('notification_channel_id', $channelIds->all())
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'unsubscribed_at' => now(),
            ]);
    }
}
