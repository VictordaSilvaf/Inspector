import { Link } from '@inertiajs/react';
import SeoHead from '@/components/seo-head';
import {
    create as webhookInspectorCreate,
    index as webhookInspectorIndex,
} from '@/routes/webhook-inspector';

export default function WebhookInspectorCreate() {
    return (
        <>
            <SeoHead title="Criar monitor de Webhook" />
            <div className="flex flex-1 flex-col gap-8">
                <div>
                    <p className="mb-2 text-sm text-ink-soft">Webhooks</p>
                    <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-ink">
                        Novo webhook
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed text-ink-muted">
                        Em breve você poderá criar um endpoint de captura e
                        inspecionar cada request aqui.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-hairline px-5 py-16 text-center">
                    <p className="text-lg font-medium text-ink">
                        Formulário em construção
                    </p>
                    <p className="mx-auto mt-2 mb-6 max-w-md text-ink-muted">
                        Enquanto isso, continue monitorando suas APIs no
                        Inspector.
                    </p>
                    <Link
                        href={webhookInspectorIndex()}
                        className="inline-flex rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/30"
                    >
                        Voltar para webhooks
                    </Link>
                </div>
            </div>
        </>
    );
}

WebhookInspectorCreate.layout = {
    breadcrumbs: [
        {
            title: 'Monitor de Webhooks',
            href: webhookInspectorIndex(),
        },
        {
            title: 'Criar',
            href: webhookInspectorCreate(),
        },
    ],
};
