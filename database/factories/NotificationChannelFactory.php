<?php

namespace Database\Factories;

use App\Enums\NotificationChannelType;
use App\Enums\NotificationChannelVerificationStatus;
use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NotificationChannel>
 */
class NotificationChannelFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => NotificationChannelType::Email,
            'value' => fake()->unique()->safeEmail(),
            'verification_status' => NotificationChannelVerificationStatus::Pending,
            'verified_at' => null,
            'is_active' => true,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => NotificationChannelVerificationStatus::Verified,
            'verified_at' => now(),
        ]);
    }
}
