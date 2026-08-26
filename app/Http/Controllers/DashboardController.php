<?php

namespace App\Http\Controllers;

use App\Models\ApiMonitor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $monitorsQuery = $user->apiMonitors();

        $total = (clone $monitorsQuery)->count();
        $active = (clone $monitorsQuery)->where('is_active', true)->count();
        $failing = (clone $monitorsQuery)->where('consecutive_failures', '>', 0)->count();
        $avgMs = (int) round((float) ((clone $monitorsQuery)
            ->whereNotNull('last_response_time_ms')
            ->avg('last_response_time_ms') ?? 0));

        $monitors = $user->apiMonitors()
            ->latest('updated_at')
            ->limit(8)
            ->get()
            ->map(fn (ApiMonitor $monitor): array => [
                ...$monitor->toFrontendArray(),
                'isActive' => $monitor->is_active,
                'consecutiveFailures' => $monitor->consecutive_failures,
            ]);

        $channelsCount = $user->notificationChannels()->count();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalMonitors' => $total,
                'activeMonitors' => $active,
                'failingMonitors' => $failing,
                'averageResponseTimeMs' => $avgMs,
                'notificationChannels' => $channelsCount,
            ],
            'monitors' => $monitors,
        ]);
    }
}
