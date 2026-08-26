<?php

namespace App\Services\Security;

use App\Mail\MonitorAbuseDetectedMail;
use App\Models\ApiMonitor;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

final class MonitorSecurityAlertService
{
    public const string EVENT_RATE_LIMIT = 'rate_limit';

    public const string EVENT_URL_BLOCKED = 'url_blocked';

    public function record(User $user, string $eventType): void
    {
        $windowMinutes = (int) config('monitors.abuse.window_minutes', 15);
        $threshold = (int) config('monitors.abuse.threshold', 5);
        $cacheKey = "monitor-security:{$user->id}:{$eventType}";

        if (! Cache::has($cacheKey)) {
            Cache::put($cacheKey, 0, now()->addMinutes($windowMinutes));
        }

        $count = (int) Cache::increment($cacheKey);

        if ($count >= $threshold) {
            $this->maybeSendAlert($user, $eventType, $count);
        }
    }

    public function recordUrlBlockedForMonitor(ApiMonitor $monitor): void
    {
        $monitor->loadMissing('user');

        if ($monitor->user === null) {
            return;
        }

        $this->record($monitor->user, self::EVENT_URL_BLOCKED);
    }

    private function maybeSendAlert(User $user, string $eventType, int $attemptCount): void
    {
        $cooldownMinutes = (int) config('monitors.abuse.alert_cooldown_minutes', 60);
        $alertKey = "monitor-security-alert:{$user->id}:{$eventType}";

        if (Cache::has($alertKey)) {
            return;
        }

        Cache::put($alertKey, true, now()->addMinutes($cooldownMinutes));

        Mail::to($user->email)->send(
            new MonitorAbuseDetectedMail($user, $eventType, $attemptCount),
        );
    }
}
