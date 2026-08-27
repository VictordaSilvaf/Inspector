<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SubscribePlanRequest;
use App\Services\Billing\PlanCatalogService;
use App\Services\Billing\PlanLimitsService;
use App\Services\Billing\StripeBillingService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Cashier\Checkout;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly PlanCatalogService $planCatalog,
        private readonly PlanLimitsService $planLimits,
        private readonly SubscriptionService $subscriptionService,
        private readonly StripeBillingService $stripeBilling,
    ) {}

    public function edit(Request $request): Response
    {
        $user = $request->user();
        $currentLimits = $this->planLimits->forUser($user);

        return Inertia::render('settings/subscription', [
            'plans' => $this->planCatalog->catalog(),
            'currentPlan' => $currentLimits->plan->value,
            'currentPlanLabel' => $currentLimits->plan->label(),
            'usage' => [
                'monitors' => $user->apiMonitors()->count(),
                'notificationChannels' => $user->notificationChannels()->count(),
            ],
            'billing' => $this->stripeBilling->subscriptionSummary($user),
        ]);
    }

    public function update(SubscribePlanRequest $request): RedirectResponse|Checkout
    {
        $user = $request->user();
        $targetPlan = $request->targetPlan();

        $errors = $this->subscriptionService->validatePlanChange($user, $targetPlan);

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'plan' => $errors[0],
            ]);
        }

        $response = $this->stripeBilling->changePlan($user, $targetPlan);

        if ($response instanceof RedirectResponse) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Plano alterado para :plan.', ['plan' => $targetPlan->label()]),
            ]);
        }

        return $response;
    }

    public function checkoutSuccess(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->stripeBilling->handleCheckoutSuccess($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Assinatura confirmada. Seu plano será atualizado em instantes.'),
        ]);

        return to_route('subscription.edit');
    }

    public function billingPortal(Request $request): RedirectResponse
    {
        return $this->stripeBilling->redirectToBillingPortal($request->user());
    }
}
