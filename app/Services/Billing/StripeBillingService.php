<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Checkout;
use Laravel\Cashier\Subscription;

class StripeBillingService
{
    public function __construct(
        private readonly UserPlanSynchronizer $userPlanSynchronizer,
        private readonly PlanStripeMapper $planStripeMapper,
    ) {}

    public function changePlan(User $user, SubscriptionPlan $targetPlan): RedirectResponse|Checkout
    {
        if ($targetPlan === SubscriptionPlan::Free) {
            return $this->downgradeToFree($user);
        }

        $priceId = $this->planStripeMapper->priceIdForPlan($targetPlan);

        if ($priceId === null) {
            throw ValidationException::withMessages([
                'plan' => __('Este plano ainda não está disponível para assinatura. Configure o price ID do Stripe.'),
            ]);
        }

        $subscription = $user->subscription('default');

        if ($subscription instanceof Subscription && $subscription->valid()) {
            $subscription->swap($priceId);
            $this->userPlanSynchronizer->sync($user);

            return redirect()->route('subscription.edit');
        }

        return $user
            ->newSubscription('default', $priceId)
            ->checkout([
                'success_url' => route('subscription.checkout.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('subscription.edit'),
                'metadata' => [
                    'plan' => $targetPlan->value,
                ],
            ]);
    }

    public function downgradeToFree(User $user): RedirectResponse
    {
        $subscription = $user->subscription('default');

        if ($subscription instanceof Subscription && $subscription->valid()) {
            $subscription->cancelNow();
        }

        $user->update(['plan' => SubscriptionPlan::Free]);

        return redirect()->route('subscription.edit');
    }

    public function redirectToBillingPortal(User $user): RedirectResponse
    {
        if (! $user->hasStripeId()) {
            throw ValidationException::withMessages([
                'billing' => __('Você ainda não possui uma assinatura paga ativa.'),
            ]);
        }

        return $user->redirectToBillingPortal(route('subscription.edit'));
    }

    public function handleCheckoutSuccess(User $user): User
    {
        return $this->userPlanSynchronizer->sync($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function subscriptionSummary(User $user): array
    {
        $subscription = $user->subscription('default');

        return [
            'hasStripeCustomer' => $user->hasStripeId(),
            'subscribed' => $user->subscribed('default'),
            'onGracePeriod' => $subscription?->onGracePeriod() ?? false,
            'endsAt' => $subscription?->ends_at?->toIso8601String(),
        ];
    }
}
