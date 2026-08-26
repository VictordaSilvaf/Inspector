<?php

namespace App\Policies;

use App\Models\MonitorAlert;
use App\Models\User;

class MonitorAlertPolicy
{
    public function view(User $user, MonitorAlert $monitorAlert): bool
    {
        return $user->id === $monitorAlert->apiMonitor->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, MonitorAlert $monitorAlert): bool
    {
        return $user->id === $monitorAlert->apiMonitor->user_id;
    }

    public function delete(User $user, MonitorAlert $monitorAlert): bool
    {
        return $user->id === $monitorAlert->apiMonitor->user_id;
    }
}
