<?php

namespace App\Models;

use App\Enums\NotificationLogEvent;
use App\Enums\NotificationLogStatus;
use Database\Factories\NotificationLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $monitor_alert_id
 * @property int|null $notification_channel_id
 * @property int|null $alert_subscription_id
 * @property NotificationLogEvent $event
 * @property NotificationLogStatus $status
 * @property Carbon|null $sent_at
 * @property Carbon|null $failed_at
 * @property string|null $error_message
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'monitor_alert_id',
    'notification_channel_id',
    'alert_subscription_id',
    'event',
    'status',
    'sent_at',
    'failed_at',
    'error_message',
])]
class NotificationLog extends Model
{
    /** @use HasFactory<NotificationLogFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
    ];

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
     * @return BelongsTo<AlertSubscription, $this>
     */
    public function alertSubscription(): BelongsTo
    {
        return $this->belongsTo(AlertSubscription::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event' => NotificationLogEvent::class,
            'status' => NotificationLogStatus::class,
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }
}
