<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;
use App\Models\User;

final class UserPlanSynchronizer
{
    public function __construct(
        private readonly PlanStripeMapper $planStripeMapper,
    ) {}

    public function sync(User $user): User
    {
        $subscription = $user->subscription('default');

        if ($subscription === null || ! $subscription->valid()) {
            if ($user->plan !== SubscriptionPlan::Free) {
                $user->update(['plan' => SubscriptionPlan::Free]);
            }

            return $user->fresh() ?? $user;
        }

        $plan = $this->planStripeMapper->planForPriceId($subscription->stripe_price);

        if ($plan !== null && $user->plan !== $plan) {
            $user->update(['plan' => $plan]);
        }

        return $user->fresh() ?? $user;
    }
}
