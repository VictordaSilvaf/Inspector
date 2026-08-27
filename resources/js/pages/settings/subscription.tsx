import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SeoHead from '@/components/seo-head';
import PlanPricingGrid from '@/components/plans/plan-pricing-grid';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    billingPortal,
    edit as subscriptionEdit,
    update as updateSubscription,
} from '@/routes/subscription';
import type { Auth } from '@/types';
import type {
    PlanCatalogItem,
    SubscriptionBillingSummary,
    SubscriptionUsage,
} from '@/types/plan';

type PageProps = {
    auth: Auth;
    plans: PlanCatalogItem[];
    currentPlan: string;
    currentPlanLabel: string;
    usage: SubscriptionUsage;
    billing: SubscriptionBillingSummary;
};

export default function Subscription({
    plans,
    currentPlan,
    currentPlanLabel,
    usage,
    billing,
}: Readonly<Omit<PageProps, 'auth'>>) {
    const { auth } = usePage<PageProps>().props;
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelectPlan = (planId: string) => {
        if (planId === currentPlan) {
            return;
        }

        setError(null);
        setProcessingPlan(planId);

        router.patch(
            updateSubscription.url(),
            { plan: planId },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setError(
                        typeof errors.plan === 'string'
                            ? errors.plan
                            : 'Não foi possível alterar o plano.',
                    );
                },
                onFinish: () => setProcessingPlan(null),
            },
        );
    };

    return (
        <>
            <SeoHead title="Assinatura" />

            <h1 className="sr-only">Assinatura</h1>

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title="Assinatura"
                    description="Gerencie seu plano e pagamentos via Stripe"
                />

                <div className="rounded-2xl border border-hairline bg-elevated p-4">
                    <p className="text-sm text-ink-muted">
                        Plano atual:{' '}
                        <span className="font-semibold text-ink">
                            {currentPlanLabel}
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                        Uso: {usage.monitors} monitor(es) ·{' '}
                        {usage.notificationChannels} canal(is) de notificação
                    </p>
                    {billing.subscribed && (
                        <p className="mt-2 text-xs text-ink-soft">
                            {billing.onGracePeriod && billing.endsAt
                                ? `Assinatura cancelada · acesso até ${new Date(billing.endsAt).toLocaleDateString('pt-BR')}.`
                                : 'Assinatura ativa · cobrança recorrente via Stripe.'}
                        </p>
                    )}
                    {billing.hasStripeCustomer && (
                        <div className="mt-4">
                            <Button asChild variant="outline" size="sm">
                                <a href={billingPortal.url()}>
                                    Gerenciar pagamento
                                </a>
                            </Button>
                        </div>
                    )}
                </div>

                <InputError message={error ?? undefined} />

                <PlanPricingGrid
                    plans={plans}
                    mode="manage"
                    currentPlan={currentPlan}
                    isAuthenticated={auth.user !== null}
                    processingPlan={processingPlan}
                    onSelectPlan={handleSelectPlan}
                />
            </div>
        </>
    );
}

Subscription.layout = {
    breadcrumbs: [
        {
            title: 'Assinatura',
            href: subscriptionEdit(),
        },
    ],
};
