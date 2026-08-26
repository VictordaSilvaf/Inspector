import { Head, router, usePoll } from '@inertiajs/react';
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
    customHeaders: Array<{ key: string; value: string }>;
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
            <Head title="Monitoradores de API" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-6 mt-8 flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="mb-2 text-2xl font-bold">
                            Monitoradores de API
                        </h1>
                        <p className="text-muted-foreground">
                            Lista de todas as API's que você está monitorando.
                            Status atualizado em tempo real.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="flex flex-row"
                        onClick={() => router.visit(create())}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Adicionar monitor
                    </Button>
                </div>

                {monitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <p className="text-lg font-medium">
                            Nenhuma API monitorada
                        </p>
                        <p className="max-w-md text-muted-foreground">
                            Adicione sua primeira API para começar a
                            acompanhar disponibilidade e tempo de resposta.
                        </p>
                        <Button onClick={() => router.visit(create())}>
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
                                className="card relative overflow-hidden border-2 border-border"
                            >
                                <h2 className="text-xl font-medium">
                                    {monitor.name}
                                </h2>
                                <p className="mb-4 text-muted-foreground">
                                    {monitor.url}
                                </p>

                                <Separator />

                                <p className="mt-4">Rota:</p>
                                <p className="text-muted-foreground">
                                    {monitor.url}
                                </p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                        <p>Método:</p>
                                        <p className="text-muted-foreground">
                                            {monitor.httpMethod}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p>Intervalo:</p>
                                        <p className="text-muted-foreground">
                                            {formatIntervalLabel(
                                                monitor.intervalSeconds,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p>Status esperado:</p>
                                        <p className="text-muted-foreground">
                                            {monitor.expectedStatusCode}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p>Última verificação:</p>
                                        <p className="text-muted-foreground">
                                            {formatLastCheckedAt(
                                                monitor.lastCheckedAt,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-2">Autenticação:</p>
                                <p className="text-muted-foreground">
                                    {monitor.hasAuthentication
                                        ? 'Configurada'
                                        : 'Não configurada'}
                                </p>

                                {monitor.customHeaders.length > 0 && (
                                    <>
                                        <p className="mt-2">Headers:</p>
                                        <p className="line-clamp-3 text-muted-foreground">
                                            {JSON.stringify(
                                                Object.fromEntries(
                                                    monitor.customHeaders.map(
                                                        (header) => [
                                                            header.key,
                                                            header.value,
                                                        ],
                                                    ),
                                                ),
                                            )}
                                        </p>
                                    </>
                                )}

                                <div className="mt-4 flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        className="flex w-full cursor-pointer flex-row"
                                        onClick={() =>
                                            router.visit(show(monitor.id))
                                        }
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                        Ver detalhes
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="flex w-full cursor-pointer flex-row"
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
