<?php

namespace App\Models;

use Database\Factories\ApiMonitorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $url
 * @property string $http_method
 * @property string $auth_type
 * @property array<string, mixed>|null $auth_metadata
 * @property int $interval_seconds
 * @property int $timeout_seconds
 * @property int $expected_status_code
 * @property bool $is_active
 * @property string|null $last_status
 * @property int|null $last_response_time_ms
 * @property Carbon|null $last_checked_at
 * @property int $consecutive_failures
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read ApiMonitorSecret|null $secret
 * @property-read Collection<int, ApiMonitorHeader> $headers
 */
#[Fillable([
    'user_id',
    'name',
    'url',
    'http_method',
    'auth_type',
    'auth_metadata',
    'interval_seconds',
    'timeout_seconds',
    'expected_status_code',
    'is_active',
    'last_status',
    'last_response_time_ms',
    'last_checked_at',
    'consecutive_failures',
])]
class ApiMonitor extends Model
{
    /** @use HasFactory<ApiMonitorFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'http_method' => 'GET',
        'auth_type' => 'none',
        'interval_seconds' => 30,
        'timeout_seconds' => 10,
        'expected_status_code' => 200,
        'is_active' => true,
        'consecutive_failures' => 0,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<ApiMonitorCheck, $this>
     */
    public function checks(): HasMany
    {
        return $this->hasMany(ApiMonitorCheck::class);
    }

    /**
     * @return HasMany<MonitorAlert, $this>
     */
    public function alerts(): HasMany
    {
        return $this->hasMany(MonitorAlert::class);
    }

    /**
     * @return HasOne<ApiMonitorSecret, $this>
     */
    public function secret(): HasOne
    {
        return $this->hasOne(ApiMonitorSecret::class);
    }

    /**
     * @return HasMany<ApiMonitorHeader, $this>
     */
    public function headers(): HasMany
    {
        return $this->hasMany(ApiMonitorHeader::class);
    }

    /**
     * @return HasMany<ApiMonitorSecretAudit, $this>
     */
    public function secretAudits(): HasMany
    {
        return $this->hasMany(ApiMonitorSecretAudit::class);
    }

    public function isDueForCheck(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->last_checked_at === null) {
            return true;
        }

        return $this->last_checked_at
            ->copy()
            ->addSeconds($this->interval_seconds)
            ->isPast();
    }

    /**
     * @return array<string, mixed>
     */
    public function toStatusArray(): array
    {
        return [
            'id' => $this->id,
            'lastStatus' => $this->last_status,
            'lastResponseTimeMs' => $this->last_response_time_ms,
            'lastCheckedAt' => $this->last_checked_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'auth_metadata' => 'array',
            'is_active' => 'boolean',
            'last_checked_at' => 'datetime',
        ];
    }
}
