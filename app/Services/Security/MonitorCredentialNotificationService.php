<?php

namespace App\Services\Security;

use App\Mail\MonitorSecretChangedMail;
use App\Models\ApiMonitor;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

final class MonitorCredentialNotificationService
{
    public function notifyChanged(
        ApiMonitor $monitor,
        string $action,
        ?User $actor = null,
    ): void {
        $monitor->loadMissing('user');

        $owner = $monitor->user;

        if ($owner === null) {
            return;
        }

        Mail::to($owner->email)->send(
            new MonitorSecretChangedMail($monitor, $action, $actor),
        );
    }
}
