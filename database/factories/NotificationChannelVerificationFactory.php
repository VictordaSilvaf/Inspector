<?php

namespace Database\Factories;

use App\Models\NotificationChannel;
use App\Models\NotificationChannelVerification;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<NotificationChannelVerification>
 */
class NotificationChannelVerificationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'notification_channel_id' => NotificationChannel::factory(),
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(NotificationChannelVerification::ExpiresInMinutes),
            'attempts' => 0,
            'verified_at' => null,
        ];
    }

    public function withCode(string $code): static
    {
        return $this->state(fn (array $attributes) => [
            'code_hash' => Hash::make($code),
        ]);
    }
}
