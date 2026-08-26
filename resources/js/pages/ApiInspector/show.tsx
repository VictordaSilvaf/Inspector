import { InfiniteScroll, router, usePoll } from '@inertiajs/react';
import SeoHead from '@/components/seo-head';
import { ArrowLeftIcon, BellIcon, HistoryIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { index as apiInspectorIndex } from '@/routes/api-inspector';
import { index as alertsIndex } from '@/routes/api-inspector/alerts';
import { index as auditIndex } from '@/routes/api-inspector/audit';
import { ApiConsulting } from '@/components/base/ApiConsulting';
import type {
    ApiHttpMethod,
    ApiMonitorIntervalSeconds,
} from '@/components/base/ApiConsulting/auth';
import ApiStatusIndicator from '@/components/base/ApiStatusIndicator';
import type { ApiStatusIndicatorStatus } from '@/components/base/ApiStatusIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type { ApiMonitorFormInitialValues } from '@/hooks/use-client-api-provider';

const LIVE_REFRESH_INTERVAL_MS = 3_000;
const HISTORY_SECTION_ID = 'api-monitor-history';
const HISTORY_REFRESH_TOP_THRESHOLD_PX = -120;

type ApiMonitorDetail = ApiMonitorFormInitialValues & {
    lastStatus: ApiStatusIndicatorStatus | null;
    lastResponseTimeMs: number | null;
    lastCheckedAt: string | null;
    hasAuthentication: boolean;
    expectedStatusCode: number;
    isActive: boolean;
    consecutiveFailures: number;
};

type ApiMonitorCheckItem = {
    id: number;
    status: ApiStatusIndicatorStatus;
    httpStatusCode: number | null;
    responseTimeMs: number | null;
    errorMessage: string | null;
    responseSizeBytes: number | null;
    responseBodyPreview: string | null;
    triggeredBy: string;
    checkedAt: string;
};

type PaginatedChecks = {
    data: ApiMonitorCheckItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type ApiInspectorShowProps = {
    monitor: ApiMonitorDetail;
    checks: PaginatedChecks;
};

function shouldRefreshHistoryList(): boolean {
    if (typeof document === 'undefined') {
        return true;
    }

    const historySection = document.getElementById(HISTORY_SECTION_ID);

    if (historySection === null) {
        return true;
    }

    // When the user has scrolled deep into older pages, the section top sits
    // far above the viewport. Skip resetting InfiniteScroll in that case.
    return (
        historySection.getBoundingClientRect().top
        > HISTORY_REFRESH_TOP_THRESHOLD_PX
    );
}

function hasNewerChecksThanList(
    lastCheckedAt: string | null,
    checks: ApiMonitorCheckItem[],
): boolean {
    if (lastCheckedAt === null || checks.length === 0) {
        return false;
    }

    return (
        new Date(lastCheckedAt).getTime()
        > new Date(checks[0].checkedAt).getTime()
    );
}

const STATUS_LABELS: Record<ApiStatusIndicatorStatus, string> = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Info',
};

const TRIGGER_LABELS: Record<string, string> = {
    scheduled: 'Agendado',
    manual: 'Manual',
};

const pageEnterVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 16,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
};

const sectionVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: 'easeOut',
        },
    },
};

const checkItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 12,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: 'easeOut',
        },
    },
};

function formatCheckedAt(checkedAt: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    }).format(new Date(checkedAt));
}

function statusBadgeVariant(
    status: ApiStatusIndicatorStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'error') {
        return 'destructive';
    }

    if (status === 'success') {
        return 'default';
    }

    return 'secondary';
}

function CheckHistoryItem({
    check,
}: Readonly<{ check: ApiMonitorCheckItem }>) {
    return (
        <motion.article
            variants={checkItemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-2xl border border-hairline bg-surface p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(check.status)}>
                        {STATUS_LABELS[check.status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {formatCheckedAt(check.checkedAt)}
                    </span>
                </div>
                <span className="text-sm text-muted-foreground">
                    {TRIGGER_LABELS[check.triggeredBy] ?? check.triggeredBy}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                    <p className="text-muted-foreground">HTTP</p>
                    <p className="font-medium">
                        {check.httpStatusCode ?? '—'}
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground">Tempo</p>
                    <p className="font-medium">
                        {check.responseTimeMs !== null
                            ? `${check.responseTimeMs}ms`
                            : '—'}
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground">Tamanho</p>
                    <p className="font-medium">
                        {check.responseSizeBytes !== null
                            ? `${check.responseSizeBytes} B`
                            : '—'}
                    </p>
                </div>
            </div>

            {check.errorMessage !== null && (
                <p className="mt-3 text-sm text-red-500">
                    {check.errorMessage}
                </p>
            )}

            {check.responseBodyPreview !== null
                && check.responseBodyPreview !== '' && (
                <>
                    <Separator className="my-3" />
                    <p className="mb-1 text-sm text-muted-foreground">
                        Preview da resposta
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                        {check.responseBodyPreview}
                    </pre>
                </>
            )}
        </motion.article>
    );
}

export default function ApiInspectorShow({
    monitor,
    checks,
}: Readonly<ApiInspectorShowProps>) {
    usePoll(
        LIVE_REFRESH_INTERVAL_MS,
        () => {
            if (shouldRefreshHistoryList()) {
                return {
                    only: ['monitor', 'checks'],
                    reset: ['checks'],
                };
            }

            return {
                only: ['monitor'],
            };
        },
        {
            keepAlive: true,
        },
    );

    const showNewChecksBanner = hasNewerChecksThanList(
        monitor.lastCheckedAt,
        checks.data,
    );

    const formInitialValues: ApiMonitorFormInitialValues = {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        httpMethod: monitor.httpMethod as ApiHttpMethod,
        intervalSeconds: monitor.intervalSeconds as ApiMonitorIntervalSeconds,
        authType: monitor.authType,
        authConfig: monitor.authConfig,
        customHeaders: monitor.customHeaders,
    };

    const loadLatestChecks = (): void => {
        router.reload({
            only: ['monitor', 'checks'],
            reset: ['checks'],
        });
    };

    return (
        <>
            <SeoHead title={`${monitor.name} · Detalhes`} />
            <div className="flex flex-1 flex-col gap-8">
                <motion.div
                    className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                    variants={pageEnterVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="ghost"
                                className="w-fit px-0 text-ink-muted hover:text-ink"
                                onClick={() =>
                                    router.visit(apiInspectorIndex())
                                }
                            >
                                <ArrowLeftIcon className="size-4" />
                                Voltar para listagem
                            </Button>
                            <Button
                                variant="outline"
                                className="w-fit rounded-full border-hairline bg-transparent hover:bg-surface-strong"
                                onClick={() =>
                                    router.visit(alertsIndex.url(monitor.id))
                                }
                            >
                                <BellIcon className="size-4" />
                                Gerenciar alertas
                            </Button>
                            <Button
                                variant="outline"
                                className="w-fit rounded-full border-hairline bg-transparent hover:bg-surface-strong"
                                onClick={() =>
                                    router.visit(auditIndex.url(monitor.id))
                                }
                            >
                                <HistoryIcon className="size-4" />
                                Auditoria de credenciais
                            </Button>
                        </div>
                        <motion.div
                            className="card relative max-w-3xl"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
                        >
                            <h1 className="pr-28 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-ink">
                                {monitor.name}
                            </h1>
                            <p className="mt-1 text-ink-muted">
                                {monitor.url}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Badge variant="outline">
                                    {monitor.httpMethod}
                                </Badge>
                                <Badge variant="outline">
                                    Intervalo {monitor.intervalSeconds}s
                                </Badge>
                                <Badge
                                    variant={
                                        monitor.isActive
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {monitor.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                                {monitor.consecutiveFailures > 0 && (
                                    <Badge variant="destructive">
                                        {monitor.consecutiveFailures} falha(s)
                                        seguidas
                                    </Badge>
                                )}
                            </div>
                            <ApiStatusIndicator
                                time={monitor.lastResponseTimeMs ?? 0}
                                status={monitor.lastStatus ?? 'info'}
                                showTime={
                                    monitor.lastResponseTimeMs !== null
                                }
                            />
                        </motion.div>
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-2">
                    <motion.section
                        className="order-1 flex flex-col gap-4 lg:order-2"
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.12 }}
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-ink">
                                Editar configuração
                            </h2>
                            <p className="text-sm text-ink-muted">
                                Atualize URL, intervalo, autenticação e
                                headers.
                            </p>
                        </div>
                        <ApiConsulting
                            mode="update"
                            initialValues={formInitialValues}
                        />
                    </motion.section>

                    <motion.section
                        id={HISTORY_SECTION_ID}
                        className="order-2 flex w-full flex-col gap-4 overflow-x-auto lg:order-1 lg:w-auto"
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        transition={{ delay: 0.20 }}
                        viewport={{ once: true, amount: 0.1 }}
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-ink">
                                Histórico de verificações
                            </h2>
                            <p className="text-sm text-ink-muted">
                                Logs das consultas feitas a esta API,
                                atualizados em tempo real.
                            </p>
                        </div>

                        {showNewChecksBanner && (
                            <motion.div
                                className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-sm text-ink-warm">
                                    Há novas verificações desde que você rolou
                                    o histórico.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-hairline"
                                    onClick={loadLatestChecks}
                                >
                                    Ver logs mais recentes
                                </Button>
                            </motion.div>
                        )}

                        {checks.data.length === 0 ? (
                            <motion.div
                                className="rounded-2xl border border-dashed border-hairline p-8 text-center text-ink-muted"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.12 }}
                            >
                                Nenhuma verificação registrada ainda.
                            </motion.div>
                        ) : (
                            <InfiniteScroll
                                data="checks"
                                buffer={280}
                                onlyNext
                                className="flex flex-col gap-3"
                                next={({ loading, hasMore }) => {
                                    if (! hasMore) {
                                        return (
                                            <p className="py-3 text-center text-sm text-ink-soft">
                                                Fim do histórico · {checks.total}{' '}
                                                registro(s)
                                            </p>
                                        );
                                    }

                                    if (! loading) {
                                        return null;
                                    }

                                    return (
                                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-soft">
                                            <Spinner className="size-4" />
                                            Carregando mais logs...
                                        </div>
                                    );
                                }}
                            >
                                {checks.data.map((check) => (
                                    <CheckHistoryItem
                                        key={check.id}
                                        check={check}
                                    />
                                ))}
                            </InfiniteScroll>
                        )}
                    </motion.section>
                </div>
            </div>
        </>
    );
}

ApiInspectorShow.layout = {
    breadcrumbs: [
        {
            title: 'Apis Monitoradas',
            href: apiInspectorIndex(),
        },
        {
            title: 'Detalhes',
            href: '#',
        },
    ],
};
