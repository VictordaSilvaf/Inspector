import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { index as apiInspectorIndex, create as apiInspectorCreate, show as apiInspectorShow } from '@/routes/api-inspector';
import { index as webhookInspectorIndex } from '@/routes/webhook-inspector';
import { edit as editProfile } from '@/routes/profile';
import { dashboard, logout } from '@/routes';

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
                <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-[#0c0b0a] p-[3px]">
                    <div className="flex size-full items-center justify-center rounded-full bg-[#161412] px-1 text-center text-[0.65rem] font-semibold leading-tight text-[#f5f0ea] sm:text-xs">
                        {value}
                    </div>
                </div>
            </div>
            <span className="text-[0.7rem] text-[#b5a89c]">{label}</span>
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

            <div className="min-h-screen bg-[#0c0b0a] font-display text-[#f5f0ea] antialiased selection:bg-[#dd2a7b]/35 selection:text-white">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(221,42,123,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(245,133,41,0.12), transparent 50%)',
                    }}
                />

                <header className="relative z-20 border-b border-white/5">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <Link
                            href={dashboard()}
                            className="text-lg font-semibold tracking-tight text-white"
                        >
                            Inspector
                        </Link>
                        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                            <Link
                                href={apiInspectorIndex()}
                                className="rounded-full px-3 py-1.5 text-sm text-[#b5a89c] transition hover:bg-white/5 hover:text-white"
                            >
                                APIs
                            </Link>
                            <Link
                                href={webhookInspectorIndex()}
                                className="rounded-full px-3 py-1.5 text-sm text-[#b5a89c] transition hover:bg-white/5 hover:text-white"
                            >
                                Webhooks
                            </Link>
                            <Link
                                href={editProfile()}
                                className="rounded-full px-3 py-1.5 text-sm text-[#b5a89c] transition hover:bg-white/5 hover:text-white"
                            >
                                Conta
                            </Link>
                            <button
                                type="button"
                                onClick={() => router.post(logout())}
                                className="rounded-full px-3 py-1.5 text-sm text-[#b5a89c] transition hover:bg-white/5 hover:text-white"
                            >
                                Sair
                            </button>
                        </nav>
                    </div>
                </header>

                <main className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <p className="mb-2 text-sm text-[#a89b90]">Painel</p>
                        <h1 className="mb-3 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em] text-balance text-white">
                            Olá, {firstName}
                        </h1>
                        <p className="mb-10 max-w-xl text-base leading-relaxed text-[#b5a89c]">
                            Acompanhe monitores, latência e falhas no mesmo
                            ritmo visual do Inspector — e entre direto no que
                            precisa de atenção.
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
                            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
                        >
                            Novo monitor de API
                        </Link>
                        <Link
                            href={apiInspectorIndex()}
                            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-[#f5f0ea] transition hover:border-white/40"
                        >
                            Ver todos
                        </Link>
                        <Link
                            href={webhookInspectorIndex()}
                            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-[#f5f0ea] transition hover:border-white/40"
                        >
                            Webhooks
                        </Link>
                    </div>

                    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                        <div className="mb-5 flex items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Monitores recentes
                                </h2>
                                <p className="text-sm text-[#a89b90]">
                                    Últimos endpoints que você acompanha
                                </p>
                            </div>
                        </div>

                        {monitors.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center">
                                <p className="mb-2 text-base font-medium text-white">
                                    Nenhum monitor ainda
                                </p>
                                <p className="mb-6 text-sm text-[#b5a89c]">
                                    Cadastre a primeira API e o Inspector
                                    começa a checar status e latência.
                                </p>
                                <Link
                                    href={apiInspectorCreate()}
                                    className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0c0b0a]"
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
                                            reduceMotion
                                                ? false
                                                : { opacity: 0, y: 10 }
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
                                            className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-[#f3ebe3]">
                                                    {monitor.name}
                                                </p>
                                                <p className="truncate text-xs text-[#a89b90]">
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
                                                    monitor.consecutiveFailures >
                                                    0
                                                        ? 'shrink-0 text-sm font-semibold text-[#ff8a4c]'
                                                        : 'shrink-0 text-sm font-semibold text-emerald-300'
                                                }
                                            >
                                                {monitor.lastResponseTimeMs !==
                                                null
                                                    ? `${monitor.lastResponseTimeMs}ms`
                                                    : '—'}
                                            </p>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}
