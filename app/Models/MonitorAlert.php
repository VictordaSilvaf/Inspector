<?php

namespace App\Models;

use App\Enums\MonitorAlertOperator;
use App\Enums\MonitorAlertState;
use App\Enums\MonitorAlertType;
use Database\Factories\MonitorAlertFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $api_monitor_id
 * @property string|null $name
 * @property MonitorAlertType $type
 * @property MonitorAlertOperator $operator
 * @property string $value
 * @property int $cooldown_seconds
 * @property bool $is_active
 * @property MonitorAlertState $state
 * @property Carbon|null $last_triggered_at
 * @property Carbon|null $last_resolved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'api_monitor_id',
    'name',
    'type',
    'operator',
    'value',
    'cooldown_seconds',
    'is_active',
    'state',
    'last_triggered_at',
    'last_resolved_at',
])]
class MonitorAlert extends Model
{
    /** @use HasFactory<MonitorAlertFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'cooldown_seconds' => 300,
        'is_active' => true,
        'state' => 'ok',
    ];

    /**
     * @return BelongsTo<ApiMonitor, $this>
     */
    public function apiMonitor(): BelongsTo
    {
        return $this->belongsTo(ApiMonitor::class);
    }

    /**
     * @return HasMany<AlertSubscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(AlertSubscription::class);
    }

    /**
     * @return HasMany<NotificationLog, $this>
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    public function isInCooldown(): bool
    {
        if ($this->last_triggered_at === null) {
            return false;
        }

        return $this->last_triggered_at
            ->copy()
            ->addSeconds($this->cooldown_seconds)
            ->isFuture();
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type->value,
            'operator' => $this->operator->value,
            'value' => $this->value,
            'cooldownSeconds' => $this->cooldown_seconds,
            'isActive' => $this->is_active,
            'state' => $this->state->value,
            'lastTriggeredAt' => $this->last_triggered_at?->toIso8601String(),
            'lastResolvedAt' => $this->last_resolved_at?->toIso8601String(),
            'subscriptions' => $this->relationLoaded('subscriptions')
                ? $this->subscriptions->map(fn (AlertSubscription $subscription): array => $subscription->toFrontendArray())->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => MonitorAlertType::class,
            'operator' => MonitorAlertOperator::class,
            'state' => MonitorAlertState::class,
            'is_active' => 'boolean',
            'last_triggered_at' => 'datetime',
            'last_resolved_at' => 'datetime',
        ];
    }
}
