import { InfiniteScroll, router } from '@inertiajs/react';
import SeoHead from '@/components/seo-head';
import { ArrowLeftIcon } from 'lucide-react';
import { show as apiInspectorShow } from '@/routes/api-inspector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type AuditMetadata = Record<string, string | number | boolean | null>;

type MonitorSecretAuditItem = {
    id: number;
    action: string;
    actionLabel: string;
    metadata: AuditMetadata | null;
    actorName: string | null;
    actorEmail: string | null;
    ipAddress: string | null;
    createdAt: string;
};

type PaginatedAudits = {
    data: MonitorSecretAuditItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type ApiInspectorAuditProps = {
    monitor: {
        id: number;
        name: string;
        url: string;
    };
    audits: PaginatedAudits;
};

function formatAuditDate(createdAt: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    }).format(new Date(createdAt));
}

function formatMetadata(metadata: AuditMetadata | null): string | null {
    if (metadata === null) {
        return null;
    }

    const parts: string[] = [];

    if ('from' in metadata && 'to' in metadata) {
        parts.push(`${String(metadata.from)} → ${String(metadata.to)}`);
    }

    if ('auth_type' in metadata) {
        parts.push(`Autenticação: ${String(metadata.auth_type)}`);
    }

    if ('reason' in metadata) {
        parts.push(`Motivo: ${String(metadata.reason)}`);
    }

    return parts.length > 0 ? parts.join(' · ') : null;
}

function AuditHistoryItem({
    audit,
}: Readonly<{ audit: MonitorSecretAuditItem }>) {
    const metadataSummary = formatMetadata(audit.metadata);
    const actorLabel =
        audit.actorName ?? audit.actorEmail ?? 'Sistema';

    return (
        <article className="rounded-2xl border border-hairline bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{audit.actionLabel}</Badge>
                <span className="text-sm text-muted-foreground">
                    {formatAuditDate(audit.createdAt)}
                </span>
            </div>

            <div className="mt-3 space-y-1 text-sm">
                <p>
                    <span className="text-muted-foreground">Por:</span>{' '}
                    <span className="font-medium">{actorLabel}</span>
                </p>
                {audit.ipAddress !== null && (
                    <p className="text-muted-foreground">
                        IP: {audit.ipAddress}
                    </p>
                )}
                {metadataSummary !== null && (
                    <p className="text-muted-foreground">{metadataSummary}</p>
                )}
            </div>
        </article>
    );
}

export default function ApiInspectorAudit({
    monitor,
    audits,
}: Readonly<ApiInspectorAuditProps>) {
    return (
        <>
            <SeoHead title={`${monitor.name} · Auditoria`} />
            <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <Button
                        variant="ghost"
                        className="w-fit px-0 text-ink-muted hover:text-ink"
                        onClick={() =>
                            router.visit(apiInspectorShow.url(monitor.id))
                        }
                    >
                        <ArrowLeftIcon className="size-4" />
                        Voltar para detalhes
                    </Button>
                    <div>
                        <p className="mb-2 text-sm text-ink-soft">Auditoria</p>
                        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-ink">
                            Histórico de credenciais
                        </h1>
                        <p className="mt-1 text-ink-muted">
                            {monitor.name} · {monitor.url}
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                            Registro de criação, alteração e remoção de
                            credenciais. Valores de segredos nunca são exibidos.
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl space-y-4">
                    {audits.data.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-hairline bg-surface p-6 text-sm text-muted-foreground">
                            Nenhum evento de credencial registrado ainda.
                        </div>
                    ) : (
                        <>
                            <InfiniteScroll data="audits">
                                {audits.data.map((audit) => (
                                    <div key={audit.id} className="mb-4">
                                        <AuditHistoryItem audit={audit} />
                                    </div>
                                ))}
                            </InfiniteScroll>
                            {audits.last_page > 1 && (
                                <>
                                    <Separator />
                                    <p className="text-sm text-muted-foreground">
                                        Página {audits.current_page} de{' '}
                                        {audits.last_page} · {audits.total}{' '}
                                        eventos
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
