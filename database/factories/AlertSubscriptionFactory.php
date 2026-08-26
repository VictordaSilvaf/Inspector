<?php

namespace Database\Factories;

use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AlertSubscription>
 */
class AlertSubscriptionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'monitor_alert_id' => MonitorAlert::factory(),
            'notification_channel_id' => NotificationChannel::factory()->verified(),
            'is_active' => true,
            'unsubscribed_at' => null,
            'unsubscribe_token' => Str::random(64),
        ];
    }

    public function unsubscribed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'unsubscribed_at' => now(),
        ]);
    }
}
