<?php

namespace App\Jobs;

use App\Enums\NotificationChannelType;
use App\Enums\NotificationLogEvent;
use App\Enums\NotificationLogStatus;
use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use App\Models\NotificationLog;
use App\Services\Alerts\Senders\EmailNotificationSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class SendMonitorAlertNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $monitorAlertId,
        public int $alertSubscriptionId,
        public string $event,
    ) {}

    public function handle(EmailNotificationSender $emailSender): void
    {
        $alert = MonitorAlert::query()->with('apiMonitor')->find($this->monitorAlertId);
        $subscription = AlertSubscription::query()
            ->with('notificationChannel')
            ->find($this->alertSubscriptionId);

        if ($alert === null || $subscription === null || ! $subscription->is_active) {
            return;
        }

        $channel = $subscription->notificationChannel;

        if ($channel === null || ! $channel->isVerified()) {
            return;
        }

        $event = NotificationLogEvent::from($this->event);

        $log = NotificationLog::query()->create([
            'monitor_alert_id' => $alert->id,
            'notification_channel_id' => $channel->id,
            'alert_subscription_id' => $subscription->id,
            'event' => $event,
            'status' => NotificationLogStatus::Pending,
        ]);

        try {
            if ($channel->type !== NotificationChannelType::Email) {
                throw new \RuntimeException('Canal de notificação não suportado.');
            }

            $emailSender->send($alert, $channel, $subscription, $event);

            $log->update([
                'status' => NotificationLogStatus::Sent,
                'sent_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $log->update([
                'status' => NotificationLogStatus::Failed,
                'failed_at' => now(),
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}
