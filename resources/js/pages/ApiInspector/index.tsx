import { router, usePoll } from '@inertiajs/react';
import SeoHead from '@/components/seo-head';
import { EyeIcon, PlusIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { create, index as apiInspectorIndex, show } from '@/routes/api-inspector';
import { index as alertsIndex } from '@/routes/api-inspector/alerts';
import { API_MONITOR_INTERVAL_LABELS } from '@/components/base/ApiConsulting/auth';
import type { ApiMonitorIntervalSeconds } from '@/components/base/ApiConsulting/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ApiStatusIndicator from '@/components/base/ApiStatusIndicator';
import type { ApiStatusIndicatorStatus } from '@/components/base/ApiStatusIndicator';

const LIVE_REFRESH_INTERVAL_MS = 3_000;

type ApiMonitorListItem = {
    id: number;
    name: string;
    url: string;
    httpMethod: string;
    intervalSeconds: ApiMonitorIntervalSeconds | number;
    expectedStatusCode: number;
    customHeaders: Array<{
        name: string;
        configured: boolean;
        isSensitive: boolean;
        value?: string;
    }>;
    customHeaderCount: number;
    lastStatus: ApiStatusIndicatorStatus | null;
    lastResponseTimeMs: number | null;
    hasAuthentication: boolean;
    lastCheckedAt: string | null;
};

type ApiInspectorIndexProps = {
    monitors: ApiMonitorListItem[];
};

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.04,
        },
    },
};

const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 16,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: 'easeOut',
            when: 'beforeChildren',
        },
    },
};

const statusIndicatorVariants: Variants = {
    hidden: {
        opacity: 0,
        x: '80%',
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
};

function formatIntervalLabel(intervalSeconds: number): string {
    if (intervalSeconds in API_MONITOR_INTERVAL_LABELS) {
        return API_MONITOR_INTERVAL_LABELS[
            intervalSeconds as ApiMonitorIntervalSeconds
        ];
    }

    return `A cada ${intervalSeconds} segundos`;
}

function formatLastCheckedAt(lastCheckedAt: string | null): string {
    if (lastCheckedAt === null) {
        return 'Aguardando primeira verificação';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    }).format(new Date(lastCheckedAt));
}

export default function ApiInspectorIndex({
    monitors,
}: Readonly<ApiInspectorIndexProps>) {
    usePoll(
        LIVE_REFRESH_INTERVAL_MS,
        {
            only: ['monitors'],
        },
        {
            keepAlive: true,
        },
    );

    return (
        <>
            <SeoHead title="Monitoradores de API" />
            <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm text-ink-soft">APIs</p>
                        <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-ink">
                            Monitoradores de API
                        </h1>
                        <p className="max-w-xl text-base leading-relaxed text-ink-muted">
                            Lista de todas as APIs que você está monitorando.
                            Status atualizado em tempo real.
                        </p>
                    </div>
                    <Button
                        className="rounded-full"
                        onClick={() => router.visit(create())}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Adicionar monitor
                    </Button>
                </div>

                {monitors.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-hairline px-5 py-16 text-center">
                        <p className="text-lg font-medium text-ink">
                            Nenhuma API monitorada
                        </p>
                        <p className="mx-auto mt-2 max-w-md text-ink-muted">
                            Adicione sua primeira API para começar a acompanhar
                            disponibilidade e tempo de resposta.
                        </p>
                        <Button
                            className="mt-6 rounded-full"
                            onClick={() => router.visit(create())}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Adicionar monitor
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        className="grid auto-rows-min gap-4 md:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {monitors.map((monitor) => (
                            <motion.div
                                key={monitor.id}
                                variants={cardVariants}
                                className="card relative overflow-hidden"
                            >
                                <h2 className="text-xl font-medium text-ink mt-3">
                                    {monitor.name}
                                </h2>
                                <p className="mb-4 text-ink-muted">
                                    {monitor.url}
                                </p>

                                <Separator className="bg-surface-strong" />

                                <p className="mt-4 text-sm text-ink-warm">
                                    Rota:
                                </p>
                                <p className="text-ink-muted">{monitor.url}</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                        <p className="text-sm text-ink-warm">
                                            Método:
                                        </p>
                                        <p className="text-ink-muted">
                                            {monitor.httpMethod}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm text-ink-warm">
                                            Intervalo:
                                        </p>
                                        <p className="text-ink-muted">
                                            {formatIntervalLabel(
                                                monitor.intervalSeconds,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm text-ink-warm">
                                            Status esperado:
                                        </p>
                                        <p className="text-ink-muted">
                                            {monitor.expectedStatusCode}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm text-ink-warm">
                                            Última verificação:
                                        </p>
                                        <p className="text-ink-muted">
                                            {formatLastCheckedAt(
                                                monitor.lastCheckedAt,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-2 text-sm text-ink-warm">
                                    Autenticação:
                                </p>
                                <p className="text-ink-muted">
                                    {monitor.hasAuthentication
                                        ? 'Configurada'
                                        : 'Não configurada'}
                                </p>

                                {monitor.customHeaderCount > 0 && (
                                    <>
                                        <p className="mt-2 text-sm text-ink-warm">
                                            Headers:
                                        </p>
                                        <p className="line-clamp-3 text-ink-muted">
                                            {monitor.customHeaders
                                                .map((header) => header.name)
                                                .join(', ')}
                                        </p>
                                    </>
                                )}

                                <div className="mt-4 flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        className="flex w-full cursor-pointer flex-row rounded-full"
                                        onClick={() =>
                                            router.visit(show(monitor.id))
                                        }
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        Ver detalhes
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="flex w-full cursor-pointer flex-row rounded-full border-hairline bg-transparent hover:bg-surface-strong"
                                        onClick={() =>
                                            router.visit(
                                                alertsIndex.url(monitor.id),
                                            )
                                        }
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Adicionar alerta
                                    </Button>
                                </div>

                                <ApiStatusIndicator
                                    time={monitor.lastResponseTimeMs ?? 0}
                                    status={monitor.lastStatus ?? 'info'}
                                    showTime={
                                        monitor.lastResponseTimeMs !== null
                                    }
                                    variants={statusIndicatorVariants}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </>
    );
}

ApiInspectorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Apis Monitoradas',
            href: apiInspectorIndex(),
        },
    ],
};
