<?php

namespace Database\Factories;

use App\Enums\MonitorAlertOperator;
use App\Enums\MonitorAlertState;
use App\Enums\MonitorAlertType;
use App\Models\ApiMonitor;
use App\Models\MonitorAlert;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MonitorAlert>
 */
class MonitorAlertFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'api_monitor_id' => ApiMonitor::factory(),
            'name' => 'Latência alta',
            'type' => MonitorAlertType::ResponseTime,
            'operator' => MonitorAlertOperator::GreaterThan,
            'value' => '2000',
            'cooldown_seconds' => 300,
            'is_active' => true,
            'state' => MonitorAlertState::Ok,
            'last_triggered_at' => null,
            'last_resolved_at' => null,
        ];
    }

    public function availability(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'API indisponível',
            'type' => MonitorAlertType::Availability,
            'operator' => MonitorAlertOperator::Equals,
            'value' => 'false',
        ]);
    }

    public function statusCode(int $expected = 200): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => "Status diferente de {$expected}",
            'type' => MonitorAlertType::StatusCode,
            'operator' => MonitorAlertOperator::NotEquals,
            'value' => (string) $expected,
        ]);
    }

    public function firing(): static
    {
        return $this->state(fn (array $attributes) => [
            'state' => MonitorAlertState::Firing,
            'last_triggered_at' => now(),
        ]);
    }
}
