<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SubscribePlanRequest;
use App\Services\Billing\PlanCatalogService;
use App\Services\Billing\PlanLimitsService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly PlanCatalogService $planCatalog,
        private readonly PlanLimitsService $planLimits,
        private readonly SubscriptionService $subscriptionService,
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
        ]);
    }

    public function update(SubscribePlanRequest $request): RedirectResponse
    {
        $user = $request->user();
        $targetPlan = $request->targetPlan();

        $this->subscriptionService->changePlan($user, $targetPlan);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Plano alterado para :plan.', ['plan' => $targetPlan->label()]),
        ]);

        return to_route('subscription.edit');
    }
}
