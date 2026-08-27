<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class SubscriptionService
{
    public function __construct(
        private readonly PlanLimitsService $planLimits,
    ) {}

    /**
     * @return list<string>
     */
    public function validatePlanChange(User $user, SubscriptionPlan $targetPlan): array
    {
        $errors = [];
        $limits = $this->planLimits->forPlan($targetPlan);

        $monitorCount = $user->apiMonitors()->count();

        if ($monitorCount > $limits->maxMonitors) {
            $errors[] = "Você possui {$monitorCount} monitores, mas o plano {$targetPlan->label()} permite no máximo {$limits->maxMonitors}.";
        }

        $invalidIntervals = $user->apiMonitors()
            ->whereNotIn('interval_seconds', $limits->allowedIntervals)
            ->count();

        if ($invalidIntervals > 0) {
            $errors[] = "Alguns monitores usam intervalo mais curto que o permitido no plano {$targetPlan->label()} (mínimo {$limits->minIntervalSeconds}s).";
        }

        if ($limits->maxNotificationChannels !== null) {
            $channelCount = $user->notificationChannels()->count();

            if ($channelCount > $limits->maxNotificationChannels) {
                $errors[] = "Você possui {$channelCount} canais de notificação, mas o plano {$targetPlan->label()} permite no máximo {$limits->maxNotificationChannels}.";
            }
        }

        if ($limits->maxAlertsPerMonitor !== null) {
            $monitorsOverAlertLimit = $user->apiMonitors()
                ->withCount('alerts')
                ->get()
                ->filter(fn ($monitor): bool => $monitor->alerts_count > $limits->maxAlertsPerMonitor)
                ->count();

            if ($monitorsOverAlertLimit > 0) {
                $errors[] = "Alguns monitores excedem o limite de {$limits->maxAlertsPerMonitor} alerta(s) do plano {$targetPlan->label()}.";
            }
        }

        if ($limits->requiresTwoFactor && ! $user->hasEnabledTwoFactorAuthentication()) {
            $errors[] = 'Ative a autenticação em dois fatores em Segurança antes de assinar o plano Business.';
        }

        return $errors;
    }

    public function changePlan(User $user, SubscriptionPlan $targetPlan): User
    {
        $errors = $this->validatePlanChange($user, $targetPlan);

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'plan' => $errors[0],
            ]);
        }

        $user->update([
            'plan' => $targetPlan,
        ]);

        return $user->fresh() ?? $user;
    }
}
