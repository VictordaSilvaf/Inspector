<?php

namespace App\Models;

use Database\Factories\ApiMonitorCheckFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $api_monitor_id
 * @property string $status
 * @property int|null $http_status_code
 * @property int|null $response_time_ms
 * @property string|null $error_message
 * @property int|null $response_size_bytes
 * @property string|null $response_body_preview
 * @property string $triggered_by
 * @property Carbon $checked_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'api_monitor_id',
    'status',
    'http_status_code',
    'response_time_ms',
    'error_message',
    'response_size_bytes',
    'response_body_preview',
    'triggered_by',
    'checked_at',
])]
class ApiMonitorCheck extends Model
{
    /** @use HasFactory<ApiMonitorCheckFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<ApiMonitor, $this>
     */
    public function apiMonitor(): BelongsTo
    {
        return $this->belongsTo(ApiMonitor::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'httpStatusCode' => $this->http_status_code,
            'responseTimeMs' => $this->response_time_ms,
            'errorMessage' => $this->error_message,
            'responseSizeBytes' => $this->response_size_bytes,
            'responseBodyPreview' => $this->response_body_preview,
            'triggeredBy' => $this->triggered_by,
            'checkedAt' => $this->checked_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checked_at' => 'datetime',
        ];
    }
}
