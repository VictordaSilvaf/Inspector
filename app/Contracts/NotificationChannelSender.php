<?php

namespace App\Contracts;

use App\Enums\NotificationLogEvent;
use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;

interface NotificationChannelSender
{
    public function send(
        MonitorAlert $alert,
        NotificationChannel $channel,
        AlertSubscription $subscription,
        NotificationLogEvent $event,
    ): void;
}
