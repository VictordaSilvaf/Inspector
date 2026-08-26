<?php

namespace Database\Factories;

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\ApiMonitorHeaderService;
use App\Services\ApiMonitorSecretService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApiMonitor>
 */
class ApiMonitorFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true).' API',
            'url' => fake()->url(),
            'http_method' => 'GET',
            'auth_type' => 'none',
            'auth_metadata' => null,
            'interval_seconds' => 30,
            'timeout_seconds' => 10,
            'expected_status_code' => 200,
            'is_active' => true,
            'last_status' => 'success',
            'last_response_time_ms' => fake()->numberBetween(10, 500),
            'last_checked_at' => now(),
            'consecutive_failures' => 0,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (ApiMonitor $monitor): void {
            app(ApiMonitorHeaderService::class)->sync($monitor, [
                ['key' => 'Accept', 'value' => 'application/json'],
            ]);
        });
    }

    public function unchecked(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_status' => null,
            'last_response_time_ms' => null,
            'last_checked_at' => null,
        ]);
    }

    public function withBearerAuth(string $token = 'secret-token'): static
    {
        return $this->state(fn (array $attributes) => [
            'auth_type' => 'bearer',
            'auth_metadata' => ['configured' => true],
        ])->afterCreating(function (ApiMonitor $monitor) use ($token): void {
            app(ApiMonitorSecretService::class)->store($monitor, ['token' => $token]);
        });
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function dueForCheck(): static
    {
        return $this->state(fn (array $attributes) => [
            'interval_seconds' => 30,
            'last_checked_at' => now()->subSeconds(31),
        ]);
    }

    public function notDueForCheck(): static
    {
        return $this->state(fn (array $attributes) => [
            'interval_seconds' => 30,
            'last_checked_at' => now()->subSeconds(5),
        ]);
    }
}
