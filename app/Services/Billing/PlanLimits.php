<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;

final readonly class PlanLimits
{
    /**
     * @param  list<int>  $allowedIntervals
     */
    public function __construct(
        public SubscriptionPlan $plan,
        public int $maxMonitors,
        public int $minIntervalSeconds,
        public ?int $maxAlertsPerMonitor,
        public ?int $maxNotificationChannels,
        public int $historyRetentionDays,
        public bool $credentialAudit,
        public bool $credentialAuditExport,
        public bool $requiresTwoFactor,
        public array $allowedIntervals,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'plan' => $this->plan->value,
            'planLabel' => $this->plan->label(),
            'maxMonitors' => $this->maxMonitors,
            'minIntervalSeconds' => $this->minIntervalSeconds,
            'allowedIntervals' => $this->allowedIntervals,
            'maxAlertsPerMonitor' => $this->maxAlertsPerMonitor,
            'maxNotificationChannels' => $this->maxNotificationChannels,
            'historyRetentionDays' => $this->historyRetentionDays,
            'credentialAudit' => $this->credentialAudit,
            'credentialAuditExport' => $this->credentialAuditExport,
            'requiresTwoFactor' => $this->requiresTwoFactor,
        ];
    }
}
