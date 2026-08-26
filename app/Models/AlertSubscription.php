<?php

namespace App\Models;

use Database\Factories\AlertSubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $monitor_alert_id
 * @property int $notification_channel_id
 * @property bool $is_active
 * @property Carbon|null $unsubscribed_at
 * @property string $unsubscribe_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'monitor_alert_id',
    'notification_channel_id',
    'is_active',
    'unsubscribed_at',
    'unsubscribe_token',
])]
class AlertSubscription extends Model
{
    /** @use HasFactory<AlertSubscriptionFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
    ];

    protected static function booted(): void
    {
        static::creating(function (AlertSubscription $subscription): void {
            if ($subscription->unsubscribe_token === null || $subscription->unsubscribe_token === '') {
                $subscription->unsubscribe_token = Str::random(64);
            }
        });
    }

    /**
     * @return BelongsTo<MonitorAlert, $this>
     */
    public function monitorAlert(): BelongsTo
    {
        return $this->belongsTo(MonitorAlert::class);
    }

    /**
     * @return BelongsTo<NotificationChannel, $this>
     */
    public function notificationChannel(): BelongsTo
    {
        return $this->belongsTo(NotificationChannel::class);
    }

    /**
     * @return HasMany<NotificationLog, $this>
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function unsubscribe(): void
    {
        $this->update([
            'is_active' => false,
            'unsubscribed_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'notificationChannelId' => $this->notification_channel_id,
            'isActive' => $this->is_active,
            'unsubscribedAt' => $this->unsubscribed_at?->toIso8601String(),
            'channel' => $this->relationLoaded('notificationChannel') && $this->notificationChannel !== null
                ? $this->notificationChannel->toFrontendArray()
                : null,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'unsubscribed_at' => 'datetime',
        ];
    }
}
