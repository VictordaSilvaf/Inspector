<?php

namespace App\Services\Alerts;

use App\Enums\MonitorAlertOperator;
use App\Enums\MonitorAlertState;
use App\Enums\MonitorAlertType;
use App\Enums\NotificationLogEvent;
use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Models\MonitorAlert;
use Throwable;

class MonitorAlertEvaluator
{
    public function __construct(
        private NotificationDispatcher $dispatcher,
    ) {}

    public function evaluate(ApiMonitor $monitor, ApiMonitorCheck $check): void
    {
        $alerts = $monitor->alerts()
            ->where('is_active', true)
            ->with(['subscriptions' => fn ($query) => $query->where('is_active', true)])
            ->get();

        foreach ($alerts as $alert) {
            try {
                $this->evaluateAlert($alert, $monitor, $check);
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    private function evaluateAlert(
        MonitorAlert $alert,
        ApiMonitor $monitor,
        ApiMonitorCheck $check,
    ): void {
        $conditionMet = $this->conditionIsMet($alert, $monitor, $check);

        if ($conditionMet) {
            if ($alert->state === MonitorAlertState::Firing && $alert->isInCooldown()) {
                return;
            }

            $alert->forceFill([
                'state' => MonitorAlertState::Firing,
                'last_triggered_at' => now(),
            ])->save();

            $this->dispatcher->dispatch($alert->fresh(['subscriptions.notificationChannel', 'apiMonitor']), NotificationLogEvent::Triggered);

            return;
        }

        if ($alert->state === MonitorAlertState::Firing) {
            $alert->forceFill([
                'state' => MonitorAlertState::Ok,
                'last_resolved_at' => now(),
            ])->save();

            $this->dispatcher->dispatch($alert->fresh(['subscriptions.notificationChannel', 'apiMonitor']), NotificationLogEvent::Recovered);
        }
    }

    private function conditionIsMet(
        MonitorAlert $alert,
        ApiMonitor $monitor,
        ApiMonitorCheck $check,
    ): bool {
        return match ($alert->type) {
            MonitorAlertType::Availability => $this->availabilityFailed($check),
            MonitorAlertType::StatusCode => $this->compare(
                $check->http_status_code,
                $alert->operator,
                (int) $alert->value,
            ),
            MonitorAlertType::ResponseTime => $check->response_time_ms !== null
                && $this->compare(
                    $check->response_time_ms,
                    $alert->operator,
                    (int) $alert->value,
                ),
        };
    }

    private function availabilityFailed(ApiMonitorCheck $check): bool
    {
        return $check->status === 'error'
            || $check->http_status_code === null;
    }

    private function compare(int|float|null $actual, MonitorAlertOperator $operator, int|float $expected): bool
    {
        if ($actual === null) {
            return $operator === MonitorAlertOperator::NotEquals;
        }

        return match ($operator) {
            MonitorAlertOperator::Equals => $actual == $expected,
            MonitorAlertOperator::NotEquals => $actual != $expected,
            MonitorAlertOperator::GreaterThan => $actual > $expected,
            MonitorAlertOperator::LessThan => $actual < $expected,
        };
    }
}
