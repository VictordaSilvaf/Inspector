import { Head, Link } from '@inertiajs/react';
import {
    create as webhookInspectorCreate,
    index as webhookInspectorIndex,
} from '@/routes/webhook-inspector';

export default function WebhookInspectorCreate() {
    return (
        <>
            <Head title="Criar monitor de Webhook" />
            <div className="flex flex-1 flex-col gap-8">
                <div>
                    <p className="mb-2 text-sm text-[#a89b90]">Webhooks</p>
                    <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-white">
                        Novo webhook
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed text-[#b5a89c]">
                        Em breve você poderá criar um endpoint de captura e
                        inspecionar cada request aqui.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-white/15 px-5 py-16 text-center">
                    <p className="text-lg font-medium text-white">
                        Formulário em construção
                    </p>
                    <p className="mx-auto mt-2 mb-6 max-w-md text-[#b5a89c]">
                        Enquanto isso, continue monitorando suas APIs no
                        Inspector.
                    </p>
                    <Link
                        href={webhookInspectorIndex()}
                        className="inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-[#f5f0ea] transition hover:border-white/40"
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
