<?php

namespace App\Policies;

use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\Billing\PlanLimitsService;

class NotificationChannelPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, NotificationChannel $notificationChannel): bool
    {
        return $user->id === $notificationChannel->user_id;
    }

    public function create(User $user): bool
    {
        $limits = app(PlanLimitsService::class)->forUser($user);

        if ($limits->maxNotificationChannels === null) {
            return true;
        }

        return $user->notificationChannels()->count() < $limits->maxNotificationChannels;
    }

    public function update(User $user, NotificationChannel $notificationChannel): bool
    {
        return $user->id === $notificationChannel->user_id;
    }

    public function delete(User $user, NotificationChannel $notificationChannel): bool
    {
        return $user->id === $notificationChannel->user_id;
    }
}
