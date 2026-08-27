import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { edit as subscriptionEdit } from '@/routes/subscription';
import type { PlanCatalogItem } from '@/types/plan';

type PlanPricingGridProps = {
    plans: PlanCatalogItem[];
    mode: 'marketing' | 'manage';
    currentPlan?: string;
    isAuthenticated?: boolean;
    processingPlan?: string | null;
    onSelectPlan?: (planId: string) => void;
};

export default function PlanPricingGrid({
    plans,
    mode,
    currentPlan,
    isAuthenticated = false,
    processingPlan = null,
    onSelectPlan,
}: Readonly<PlanPricingGridProps>) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
                const isCurrent = currentPlan === plan.id;

                return (
                    <Card
                        key={plan.id}
                        className={cn(
                            'relative border-hairline bg-surface',
                            plan.highlighted &&
                                'border-brand/40 shadow-[0_0_0_1px_rgba(221,42,123,0.15)]',
                            isCurrent &&
                                mode === 'manage' &&
                                'border-emerald-500/40',
                        )}
                    >
                        {plan.highlighted && mode === 'marketing' && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                                Mais popular
                            </span>
                        )}

                        {isCurrent && mode === 'manage' && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-background uppercase">
                                Plano atual
                            </span>
                        )}

                        <CardHeader className="gap-3">
                            <CardTitle className="text-xl text-ink">
                                {plan.name}
                            </CardTitle>
                            <CardDescription className="text-ink-muted">
                                {plan.description}
                            </CardDescription>
                            <div className="pt-2">
                                <p className="font-display text-3xl font-semibold tracking-tight text-ink">
                                    {plan.monthlyPriceLabel}
                                </p>
                                {plan.monthlyPriceCents > 0 && (
                                    <p className="text-xs text-ink-soft">
                                        por mês · cobrança simulada
                                    </p>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            <ul className="space-y-2.5">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex gap-2.5 text-sm text-ink-muted"
                                    >
                                        <Check
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0 text-emerald-400"
                                        />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto">
                            {mode === 'marketing' ? (
                                <MarketingAction
                                    plan={plan}
                                    isAuthenticated={isAuthenticated}
                                />
                            ) : (
                                <ManageAction
                                    plan={plan}
                                    isCurrent={isCurrent}
                                    isProcessing={processingPlan === plan.id}
                                    onSelectPlan={onSelectPlan}
                                />
                            )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

function MarketingAction({
    plan,
    isAuthenticated,
}: Readonly<{
    plan: PlanCatalogItem;
    isAuthenticated: boolean;
}>) {
    if (isAuthenticated) {
        return (
            <Button asChild className="w-full">
                <Link href={subscriptionEdit()}>Gerenciar assinatura</Link>
            </Button>
        );
    }

    const label =
        plan.id === 'free' ? 'Começar grátis' : `Assinar ${plan.name}`;

    return (
        <Button asChild className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
            <Link href={register()}>{label}</Link>
        </Button>
    );
}

function ManageAction({
    plan,
    isCurrent,
    isProcessing,
    onSelectPlan,
}: Readonly<{
    plan: PlanCatalogItem;
    isCurrent: boolean;
    isProcessing: boolean;
    onSelectPlan?: (planId: string) => void;
}>) {
    return (
        <Button
            type="button"
            className="w-full"
            variant={isCurrent ? 'secondary' : plan.highlighted ? 'default' : 'outline'}
            disabled={isCurrent || isProcessing}
            onClick={() => onSelectPlan?.(plan.id)}
        >
            {isCurrent
                ? 'Plano ativo'
                : isProcessing
                  ? 'Alterando...'
                  : `Mudar para ${plan.name}`}
        </Button>
    );
}
