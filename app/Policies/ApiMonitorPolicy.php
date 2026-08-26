<?php

namespace App\Policies;

use App\Models\ApiMonitor;
use App\Models\User;

class ApiMonitorPolicy
{
    public function view(User $user, ApiMonitor $apiMonitor): bool
    {
        return $user->id === $apiMonitor->user_id;
    }

    public function update(User $user, ApiMonitor $apiMonitor): bool
    {
        return $user->id === $apiMonitor->user_id;
    }

    public function delete(User $user, ApiMonitor $apiMonitor): bool
    {
        return $user->id === $apiMonitor->user_id;
    }
}
