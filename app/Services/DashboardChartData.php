<?php

namespace App\Services;

use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DashboardChartData
{
    private const int TREND_HOURS = 24;

    /**
     * @return array{
     *     statusBreakdown: list<array{status: string, label: string, count: int}>,
     *     latencyTrend: list<array{label: string, averageMs: int|null, checks: int}>,
     *     availabilityTrend: list<array{label: string, success: int, warning: int, error: int}>,
     *     monitorLatency: list<array{id: int, name: string, averageMs: int, status: string|null}>,
     * }
     */
    public function forUser(User $user): array
    {
        $monitorIds = $user->apiMonitors()->pluck('id');

        if ($monitorIds->isEmpty()) {
            return $this->emptyCharts();
        }

        $since = now()->subHours(self::TREND_HOURS);

        $checks = ApiMonitorCheck::query()
            ->whereIn('api_monitor_id', $monitorIds)
            ->where('checked_at', '>=', $since)
            ->get(['status', 'response_time_ms', 'checked_at', 'api_monitor_id']);

        return [
            'statusBreakdown' => $this->statusBreakdown($checks),
            'latencyTrend' => $this->latencyTrend($checks, $since),
            'availabilityTrend' => $this->availabilityTrend($checks, $since),
            'monitorLatency' => $this->monitorLatency($user, $since),
        ];
    }

    /**
     * @return array{
     *     statusBreakdown: list<array{status: string, label: string, count: int}>,
     *     latencyTrend: list<array{label: string, averageMs: int|null, checks: int}>,
     *     availabilityTrend: list<array{label: string, success: int, warning: int, error: int}>,
     *     monitorLatency: list<array{id: int, name: string, averageMs: int, status: string|null}>,
     * }
     */
    private function emptyCharts(): array
    {
        return [
            'statusBreakdown' => [
                ['status' => 'success', 'label' => 'Sucesso', 'count' => 0],
                ['status' => 'warning', 'label' => 'Alerta', 'count' => 0],
                ['status' => 'error', 'label' => 'Erro', 'count' => 0],
            ],
            'latencyTrend' => $this->emptyHourlyTrend(),
            'availabilityTrend' => $this->emptyAvailabilityTrend(),
            'monitorLatency' => [],
        ];
    }

    /**
     * @param  Collection<int, ApiMonitorCheck>  $checks
     * @return list<array{status: string, label: string, count: int}>
     */
    private function statusBreakdown(Collection $checks): array
    {
        $counts = $checks->countBy('status');

        return [
            [
                'status' => 'success',
                'label' => 'Sucesso',
                'count' => (int) ($counts->get('success') ?? 0),
            ],
            [
                'status' => 'warning',
                'label' => 'Alerta',
                'count' => (int) ($counts->get('warning') ?? 0),
            ],
            [
                'status' => 'error',
                'label' => 'Erro',
                'count' => (int) ($counts->get('error') ?? 0),
            ],
        ];
    }

    /**
     * @param  Collection<int, ApiMonitorCheck>  $checks
     * @return list<array{label: string, averageMs: int|null, checks: int}>
     */
    private function latencyTrend(Collection $checks, CarbonInterface $since): array
    {
        $buckets = $this->hourlyBuckets($since);

        foreach ($checks as $check) {
            $key = $check->checked_at->copy()->startOfHour()->toIso8601String();

            if (! array_key_exists($key, $buckets)) {
                continue;
            }

            $buckets[$key]['checks']++;
            $buckets[$key]['totalMs'] += (int) ($check->response_time_ms ?? 0);
            $buckets[$key]['timedChecks'] += $check->response_time_ms !== null ? 1 : 0;
        }

        return array_values(array_map(function (array $bucket): array {
            $averageMs = $bucket['timedChecks'] > 0
                ? (int) round($bucket['totalMs'] / $bucket['timedChecks'])
                : null;

            return [
                'label' => $bucket['label'],
                'averageMs' => $averageMs,
                'checks' => $bucket['checks'],
            ];
        }, $buckets));
    }

    /**
     * @param  Collection<int, ApiMonitorCheck>  $checks
     * @return list<array{label: string, success: int, warning: int, error: int}>
     */
    private function availabilityTrend(Collection $checks, CarbonInterface $since): array
    {
        $buckets = $this->emptyAvailabilityBuckets($since);

        foreach ($checks as $check) {
            $key = $check->checked_at->copy()->startOfHour()->toIso8601String();

            if (! array_key_exists($key, $buckets)) {
                continue;
            }

            if (in_array($check->status, ['success', 'warning', 'error'], true)) {
                $buckets[$key][$check->status]++;
            }
        }

        return array_values(array_map(
            fn (array $bucket): array => [
                'label' => $bucket['label'],
                'success' => $bucket['success'],
                'warning' => $bucket['warning'],
                'error' => $bucket['error'],
            ],
            $buckets,
        ));
    }

    /**
     * @return list<array{id: int, name: string, averageMs: int, status: string|null}>
     */
    private function monitorLatency(User $user, CarbonInterface $since): array
    {
        return $user->apiMonitors()
            ->withAvg([
                'checks as average_response_time_ms' => fn ($query) => $query
                    ->where('checked_at', '>=', $since)
                    ->whereNotNull('response_time_ms'),
            ], 'response_time_ms')
            ->orderByDesc('average_response_time_ms')
            ->limit(6)
            ->get()
            ->filter(fn (ApiMonitor $monitor): bool => $monitor->average_response_time_ms !== null)
            ->map(fn (ApiMonitor $monitor): array => [
                'id' => $monitor->id,
                'name' => $monitor->name,
                'averageMs' => (int) round((float) $monitor->average_response_time_ms),
                'status' => $monitor->last_status,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, array{label: string, checks: int, totalMs: int, timedChecks: int}>
     */
    private function hourlyBuckets(CarbonInterface $since): array
    {
        $buckets = [];

        for ($hour = 0; $hour < self::TREND_HOURS; $hour++) {
            $start = $since->copy()->addHours($hour)->startOfHour();
            $buckets[$start->toIso8601String()] = [
                'label' => $start->format('H:i'),
                'checks' => 0,
                'totalMs' => 0,
                'timedChecks' => 0,
            ];
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, averageMs: int|null, checks: int}>
     */
    private function emptyHourlyTrend(): array
    {
        $since = now()->subHours(self::TREND_HOURS);

        return array_values(array_map(
            fn (array $bucket): array => [
                'label' => $bucket['label'],
                'averageMs' => null,
                'checks' => 0,
            ],
            $this->hourlyBuckets($since),
        ));
    }

    /**
     * @return list<array{label: string, success: int, warning: int, error: int}>
     */
    private function emptyAvailabilityTrend(): array
    {
        $since = now()->subHours(self::TREND_HOURS);

        return array_values(array_map(
            fn (array $bucket): array => [
                'label' => $bucket['label'],
                'success' => $bucket['success'],
                'warning' => $bucket['warning'],
                'error' => $bucket['error'],
            ],
            $this->emptyAvailabilityBuckets($since),
        ));
    }

    /**
     * @return array<string, array{label: string, success: int, warning: int, error: int}>
     */
    private function emptyAvailabilityBuckets(CarbonInterface $since): array
    {
        $buckets = [];

        for ($hour = 0; $hour < self::TREND_HOURS; $hour++) {
            $start = $since->copy()->addHours($hour)->startOfHour();
            $buckets[$start->toIso8601String()] = [
                'label' => $start->format('H:i'),
                'success' => 0,
                'warning' => 0,
                'error' => 0,
            ];
        }

        return $buckets;
    }
}
