<?php

namespace App\Models;

use Database\Factories\ApiMonitorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $url
 * @property string $http_method
 * @property string $auth_type
 * @property array<string, mixed>|null $auth_config
 * @property array<int, array{key: string, value: string}>|null $custom_headers
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
 */
#[Fillable([
    'user_id',
    'name',
    'url',
    'http_method',
    'auth_type',
    'auth_config',
    'custom_headers',
    'interval_seconds',
    'timeout_seconds',
    'expected_status_code',
    'is_active',
    'last_status',
    'last_response_time_ms',
    'last_checked_at',
    'consecutive_failures',
])]
#[Hidden(['auth_config'])]
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
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'url' => $this->url,
            'httpMethod' => $this->http_method,
            'intervalSeconds' => $this->interval_seconds,
            'expectedStatusCode' => $this->expected_status_code,
            'customHeaders' => $this->custom_headers ?? [],
            'lastStatus' => $this->last_status,
            'lastResponseTimeMs' => $this->last_response_time_ms,
            'hasAuthentication' => $this->auth_type !== 'none',
            'lastCheckedAt' => $this->last_checked_at?->toIso8601String(),
        ];
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
     * @return array<string, mixed>
     */
    public function toDetailArray(): array
    {
        $authConfig = is_array($this->auth_config) ? $this->auth_config : [];

        return [
            ...$this->toFrontendArray(),
            'authType' => $this->auth_type,
            'authConfig' => [
                'username' => $authConfig['username'] ?? '',
                'password' => $authConfig['password'] ?? '',
                'token' => $authConfig['token'] ?? '',
                'apiKey' => $authConfig['api_key'] ?? '',
                'headerName' => $authConfig['header_name'] ?? 'X-API-Key',
            ],
            'isActive' => $this->is_active,
            'consecutiveFailures' => $this->consecutive_failures,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'auth_config' => 'encrypted:array',
            'custom_headers' => 'array',
            'is_active' => 'boolean',
            'last_checked_at' => 'datetime',
        ];
    }
}
