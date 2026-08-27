<?php

namespace App\Services\Billing;

use App\Enums\SubscriptionPlan;

final class PlanCatalogService
{
    public function __construct(
        private readonly PlanLimitsService $planLimits,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function catalog(): array
    {
        $highlighted = (string) config('plans.default_highlighted', SubscriptionPlan::Pro->value);

        return array_map(
            fn (SubscriptionPlan $plan): array => $this->toCatalogItem($plan, $plan->value === $highlighted),
            SubscriptionPlan::cases(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toCatalogItem(SubscriptionPlan $plan, ?bool $highlighted = null): array
    {
        $limits = $this->planLimits->forPlan($plan);
        /** @var array<string, mixed> $tier */
        $tier = config("plans.tiers.{$plan->value}", []);

        if ($highlighted === null) {
            $highlighted = $plan->value === config('plans.default_highlighted');
        }

        return [
            'id' => $plan->value,
            'name' => $plan->label(),
            'description' => (string) ($tier['description'] ?? ''),
            'monthlyPriceCents' => (int) ($tier['monthly_price_cents'] ?? 0),
            'monthlyPriceLabel' => $this->formatPriceLabel((int) ($tier['monthly_price_cents'] ?? 0)),
            'highlighted' => $highlighted,
            'features' => $this->featureList($limits),
            'limits' => $limits->toFrontendArray(),
        ];
    }

    /**
     * @return list<string>
     */
    private function featureList(PlanLimits $limits): array
    {
        $features = [
            sprintf('%d monitores', $limits->maxMonitors),
            sprintf('Intervalo mínimo de %ds', $limits->minIntervalSeconds),
            $limits->maxAlertsPerMonitor === null
                ? 'Alertas ilimitados por monitor'
                : sprintf('%d alerta por monitor', $limits->maxAlertsPerMonitor),
            $limits->maxNotificationChannels === null
                ? 'Canais de e-mail ilimitados'
                : sprintf('%d canal(is) de e-mail', $limits->maxNotificationChannels),
            sprintf('Histórico por %d dias', $limits->historyRetentionDays),
        ];

        if ($limits->credentialAudit) {
            $features[] = 'Auditoria de credenciais';
        }

        if ($limits->credentialAuditExport) {
            $features[] = 'Exportação de auditoria (CSV)';
        }

        if ($limits->requiresTwoFactor) {
            $features[] = '2FA obrigatório para a conta';
        }

        return $features;
    }

    private function formatPriceLabel(int $cents): string
    {
        if ($cents === 0) {
            return 'Grátis';
        }

        return 'R$ '.number_format($cents / 100, 2, ',', '.');
    }
}
