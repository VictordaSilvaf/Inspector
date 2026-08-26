import { Head, Link } from '@inertiajs/react';
import {
    create as webhookInspectorCreate,
    index as webhookInspectorIndex,
} from '@/routes/webhook-inspector';

export default function WebhookInspectorIndex() {
    return (
        <>
            <Head title="Monitoradores de Webhook" />
            <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-sm text-[#a89b90]">Webhooks</p>
                        <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-white">
                            Monitoradores de Webhook
                        </h1>
                        <p className="max-w-xl text-base leading-relaxed text-[#b5a89c]">
                            Capture payloads, inspecione headers e acompanhe
                            entregas em tempo real — em breve.
                        </p>
                    </div>
                    <Link
                        href={webhookInspectorCreate()}
                        className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
                    >
                        Novo webhook
                    </Link>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-white/15 px-5 py-16 text-center">
                    <p className="text-lg font-medium text-white">
                        Em construção
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-[#b5a89c]">
                        O monitor de webhooks vai usar o mesmo visual do
                        Inspector. Volte em breve para configurar endpoints de
                        captura.
                    </p>
                </div>
            </div>
        </>
    );
}

WebhookInspectorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Monitor de Webhooks',
            href: webhookInspectorIndex(),
        },
    ],
};
