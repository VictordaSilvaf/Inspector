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
 * @property string $name
 * @property string|null $value_encrypted
 * @property string|null $value_plain
 * @property bool $is_sensitive
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'value_encrypted',
    'value_plain',
    'is_sensitive',
])]
#[Hidden(['value_encrypted', 'value_plain'])]
class ApiMonitorHeader extends Model
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
            'is_sensitive' => 'boolean',
        ];
    }
}
