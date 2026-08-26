<?php

namespace App\Models;

use Database\Factories\NotificationChannelVerificationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $notification_channel_id
 * @property string $code_hash
 * @property Carbon $expires_at
 * @property int $attempts
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'notification_channel_id',
    'code_hash',
    'expires_at',
    'attempts',
    'verified_at',
])]
class NotificationChannelVerification extends Model
{
    /** @use HasFactory<NotificationChannelVerificationFactory> */
    use HasFactory;

    public const int MaxAttempts = 5;

    public const int ExpiresInMinutes = 10;

    public const int ResendCooldownSeconds = 60;

    /**
     * @return BelongsTo<NotificationChannel, $this>
     */
    public function notificationChannel(): BelongsTo
    {
        return $this->belongsTo(NotificationChannel::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function hasExceededAttempts(): bool
    {
        return $this->attempts >= self::MaxAttempts;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }
}
