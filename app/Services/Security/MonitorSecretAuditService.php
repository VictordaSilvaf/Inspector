<?php

namespace App\Services\Security;

use App\Models\ApiMonitor;
use App\Models\ApiMonitorSecretAudit;
use App\Models\User;
use Illuminate\Support\Facades\Request;

final class MonitorSecretAuditService
{
    public const string ACTION_SECRET_CREATED = 'secret.created';

    public const string ACTION_SECRET_ROTATED = 'secret.rotated';

    public const string ACTION_SECRET_DELETED = 'secret.deleted';

    public const string ACTION_AUTH_TYPE_CHANGED = 'auth_type.changed';

    public const string ACTION_URL_BLOCKED = 'url.blocked';

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        ApiMonitor $monitor,
        string $action,
        ?User $user = null,
        array $metadata = [],
    ): void {
        $request = Request::instance();

        ApiMonitorSecretAudit::query()->create([
            'user_id' => $user?->id,
            'api_monitor_id' => $monitor->id,
            'action' => $action,
            'metadata' => $metadata === [] ? null : $metadata,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
