<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;
use App\Models\User;

final class PlanLimitsService
{
    public function forUser(?User $user): PlanLimits
    {
        $plan = $user?->plan ?? SubscriptionPlan::Free;

        return $this->forPlan($plan);
    }

    public function forPlan(SubscriptionPlan $plan): PlanLimits
    {
        /** @var array<string, mixed> $tier */
        $tier = config("plans.tiers.{$plan->value}");

        /** @var list<int> $allIntervals */
        $allIntervals = config('plans.intervals', [5, 10, 15, 30, 60]);
        $minInterval = (int) ($tier['min_interval_seconds'] ?? 30);

        $allowedIntervals = array_values(array_filter(
            $allIntervals,
            static fn (int $interval): bool => $interval >= $minInterval,
        ));

        return new PlanLimits(
            plan: $plan,
            maxMonitors: (int) ($tier['max_monitors'] ?? 3),
            minIntervalSeconds: $minInterval,
            maxAlertsPerMonitor: is_int($tier['max_alerts_per_monitor'] ?? null)
                ? $tier['max_alerts_per_monitor']
                : null,
            maxNotificationChannels: is_int($tier['max_notification_channels'] ?? null)
                ? $tier['max_notification_channels']
                : null,
            historyRetentionDays: (int) ($tier['history_retention_days'] ?? 7),
            credentialAudit: (bool) ($tier['credential_audit'] ?? false),
            credentialAuditExport: (bool) ($tier['credential_audit_export'] ?? false),
            requiresTwoFactor: (bool) ($tier['requires_two_factor'] ?? false),
            allowedIntervals: $allowedIntervals,
        );
    }
}
