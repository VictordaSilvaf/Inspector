<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;

final class PlanStripeMapper
{
    public function priceIdForPlan(SubscriptionPlan $plan): ?string
    {
        if ($plan === SubscriptionPlan::Free) {
            return null;
        }

        /** @var string|null $priceId */
        $priceId = config("plans.tiers.{$plan->value}.stripe_price_id");

        if (! is_string($priceId) || $priceId === '') {
            return null;
        }

        return $priceId;
    }

    public function planForPriceId(?string $priceId): ?SubscriptionPlan
    {
        if ($priceId === null || $priceId === '') {
            return null;
        }

        foreach (SubscriptionPlan::cases() as $plan) {
            if ($this->priceIdForPlan($plan) === $priceId) {
                return $plan;
            }
        }

        return null;
    }
}
