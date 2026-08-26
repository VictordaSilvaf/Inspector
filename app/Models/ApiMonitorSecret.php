<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $api_monitor_id
 * @property string $encrypted_payload
 * @property int $key_version
 * @property Carbon|null $last_rotated_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'encrypted_payload',
    'key_version',
    'last_rotated_at',
])]
#[Hidden(['encrypted_payload'])]
class ApiMonitorSecret extends Model
{
    /**
     * @return BelongsTo<ApiMonitor, $this>
     */
    public function monitor(): BelongsTo
    {
        return $this->belongsTo(ApiMonitor::class, 'api_monitor_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_rotated_at' => 'datetime',
        ];
    }
}
