import { Head, Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import {
    create as apiInspectorCreate,
    index as apiInspectorIndex,
    show as apiInspectorShow,
} from '@/routes/api-inspector';
import { index as webhookInspectorIndex } from '@/routes/webhook-inspector';
import { dashboard } from '@/routes';

type DashboardMonitor = {
    id: number;
    name: string;
    url: string;
    httpMethod: string;
    lastStatus: string | null;
    lastResponseTimeMs: number | null;
    isActive: boolean;
    consecutiveFailures: number;
};

type DashboardStats = {
    totalMonitors: number;
    activeMonitors: number;
    failingMonitors: number;
    averageResponseTimeMs: number;
    notificationChannels: number;
};

type Props = {
    stats: DashboardStats;
    monitors: DashboardMonitor[];
};

function StoryStat({
    label,
    value,
    delay = 0,
}: {
    label: string;
    value: string;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <div className="flex w-[4.75rem] flex-col items-center gap-2 sm:w-24">
            <div className="relative size-[4.75rem] sm:size-24">
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background:
                            'conic-gradient(from 210deg, #f58529, #dd2a7b, #8134af, #515bd4, #f58529)',
                    }}
                    animate={reduceMotion ? undefined : { rotate: 360 }}
                    transition={
                        reduceMotion
                            ? undefined
                            : {
                                  duration: 16,
                                  repeat: Infinity,
                                  ease: 'linear',
                                  delay,
                              }
                    }
                />
                <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-canvas p-[3px]">
                    <div className="flex size-full items-center justify-center rounded-full bg-elevated px-1 text-center text-[0.65rem] font-semibold leading-tight text-ink sm:text-xs">
                        {value}
                    </div>
                </div>
            </div>
            <span className="text-[0.7rem] text-ink-muted">{label}</span>
        </div>
    );
}

function statusLabel(status: string | null, failures: number): string {
    if (failures > 0) {
        return `${failures} falha(s)`;
    }

    if (status === 'success') {
        return 'Saudável';
    }

    if (status === 'error') {
        return 'Com erro';
    }

    if (status === null) {
        return 'Sem checagem';
    }

    return status;
}

export default function Dashboard({ stats, monitors }: Props) {
    const { auth } = usePage().props;
    const reduceMotion = useReducedMotion();
    const firstName = auth.user?.name?.split(' ')[0] ?? 'olá';

    return (
        <>
            <Head title="Painel" />

            <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
                <p className="mb-2 text-sm text-ink-soft">Painel</p>
                <h1 className="mb-3 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em] text-balance text-ink">
                    Olá, {firstName}
                </h1>
                <p className="mb-10 max-w-xl text-base leading-relaxed text-ink-muted">
                    Acompanhe monitores, latência e falhas no mesmo ritmo visual
                    do Inspector — e entre direto no que precisa de atenção.
                </p>
            </motion.div>

            <div className="mb-12 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <StoryStat
                    label="Monitores"
                    value={String(stats.totalMonitors)}
                    delay={0}
                />
                <StoryStat
                    label="Ativos"
                    value={String(stats.activeMonitors)}
                    delay={0.3}
                />
                <StoryStat
                    label="Com falha"
                    value={String(stats.failingMonitors)}
                    delay={0.6}
                />
                <StoryStat
                    label="Média ms"
                    value={
                        stats.averageResponseTimeMs > 0
                            ? `${stats.averageResponseTimeMs}`
                            : '—'
                    }
                    delay={0.9}
                />
                <StoryStat
                    label="Canais"
                    value={String(stats.notificationChannels)}
                    delay={1.2}
                />
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
                <Link
                    href={apiInspectorCreate()}
                    className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90"
                >
                    Novo monitor de API
                </Link>
                <Link
                    href={apiInspectorIndex()}
                    className="inline-flex items-center justify-center rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                >
                    Ver todos
                </Link>
                <Link
                    href={webhookInspectorIndex()}
                    className="inline-flex items-center justify-center rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                >
                    Webhooks
                </Link>
            </div>

            <section className="rounded-[1.5rem] border border-hairline bg-surface p-5 sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-ink">
                            Monitores recentes
                        </h2>
                        <p className="text-sm text-ink-soft">
                            Últimos endpoints que você acompanha
                        </p>
                    </div>
                </div>

                {monitors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-hairline px-5 py-12 text-center">
                        <p className="mb-2 text-base font-medium text-ink">
                            Nenhum monitor ainda
                        </p>
                        <p className="mb-6 text-sm text-ink-muted">
                            Cadastre a primeira API e o Inspector começa a
                            checar status e latência.
                        </p>
                        <Link
                            href={apiInspectorCreate()}
                            className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas"
                        >
                            Criar primeiro monitor
                        </Link>
                    </div>
                ) : (
                    <ul className="space-y-2.5">
                        {monitors.map((monitor, index) => (
                            <motion.li
                                key={monitor.id}
                                initial={
                                    reduceMotion ? false : { opacity: 0, y: 10 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.05,
                                    duration: 0.4,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <Link
                                    href={apiInspectorShow(monitor.id)}
                                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 transition hover:bg-surface-strong"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-ink-warm">
                                            {monitor.name}
                                        </p>
                                        <p className="truncate text-xs text-ink-soft">
                                            {monitor.httpMethod} ·{' '}
                                            {statusLabel(
                                                monitor.lastStatus,
                                                monitor.consecutiveFailures,
                                            )}
                                            {!monitor.isActive
                                                ? ' · pausado'
                                                : ''}
                                        </p>
                                    </div>
                                    <p
                                        className={
                                            monitor.consecutiveFailures > 0
                                                ? 'shrink-0 text-sm font-semibold text-brand-warm'
                                                : 'shrink-0 text-sm font-semibold text-emerald-300'
                                        }
                                    >
                                        {monitor.lastResponseTimeMs !== null
                                            ? `${monitor.lastResponseTimeMs}ms`
                                            : '—'}
                                    </p>
                                </Link>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Painel',
            href: dashboard(),
        },
    ],
};
