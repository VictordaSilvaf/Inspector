<?php

namespace Database\Factories;

use App\Enums\NotificationLogEvent;
use App\Enums\NotificationLogStatus;
use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use App\Models\NotificationLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NotificationLog>
 */
class NotificationLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'monitor_alert_id' => MonitorAlert::factory(),
            'notification_channel_id' => NotificationChannel::factory()->verified(),
            'alert_subscription_id' => AlertSubscription::factory(),
            'event' => NotificationLogEvent::Triggered,
            'status' => NotificationLogStatus::Sent,
            'sent_at' => now(),
            'failed_at' => null,
            'error_message' => null,
        ];
    }
}
