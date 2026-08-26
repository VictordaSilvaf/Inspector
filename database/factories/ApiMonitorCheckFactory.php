<?php

namespace Database\Factories;

use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApiMonitorCheck>
 */
class ApiMonitorCheckFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'api_monitor_id' => ApiMonitor::factory(),
            'status' => 'success',
            'http_status_code' => 200,
            'response_time_ms' => fake()->numberBetween(10, 500),
            'error_message' => null,
            'response_size_bytes' => fake()->numberBetween(100, 5000),
            'response_body_preview' => '{"ok":true}',
            'triggered_by' => 'manual',
            'checked_at' => now(),
        ];
    }
}
