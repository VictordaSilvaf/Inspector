<?php

namespace App\Services\Alerts;

use App\Enums\NotificationLogEvent;
use App\Jobs\SendMonitorAlertNotificationJob;
use App\Models\MonitorAlert;

class NotificationDispatcher
{
    public function dispatch(MonitorAlert $alert, NotificationLogEvent $event): void
    {
        $subscriptions = $alert->subscriptions
            ->filter(fn ($subscription) => $subscription->is_active)
            ->filter(fn ($subscription) => $subscription->notificationChannel?->isVerified() === true);

        foreach ($subscriptions as $subscription) {
            SendMonitorAlertNotificationJob::dispatch(
                $alert->id,
                $subscription->id,
                $event->value,
            );
        }
    }
}
