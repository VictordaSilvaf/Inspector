<?php

namespace App\Services\Alerts\Senders;

use App\Contracts\NotificationChannelSender;
use App\Enums\NotificationLogEvent;
use App\Mail\MonitorAlertRecoveredMail;
use App\Mail\MonitorAlertTriggeredMail;
use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use Illuminate\Support\Facades\Mail;

class EmailNotificationSender implements NotificationChannelSender
{
    public function send(
        MonitorAlert $alert,
        NotificationChannel $channel,
        AlertSubscription $subscription,
        NotificationLogEvent $event,
    ): void {
        $mailable = $event === NotificationLogEvent::Recovered
            ? new MonitorAlertRecoveredMail($alert, $subscription)
            : new MonitorAlertTriggeredMail($alert, $subscription);

        Mail::to($channel->value)->send($mailable);
    }
}
