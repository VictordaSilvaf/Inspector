import { Head } from '@inertiajs/react';
import {
    create as apiInspectorCreate,
    index as apiInspectorIndex,
} from '@/routes/api-inspector';
import { ApiConsulting } from '@/components/base/ApiConsulting';

export default function ApiInspectorCreate() {
    return (
        <>
            <Head title="Criar monitor de API" />
            <div className="flex flex-1 flex-col gap-8">
                <div>
                    <p className="mb-2 text-sm text-[#a89b90]">APIs</p>
                    <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-white">
                        Novo monitor
                    </h1>
                    <p className="max-w-xl text-base leading-relaxed text-[#b5a89c]">
                        Informe a URL, o intervalo e a autenticação. O Inspector
                        começa a checar assim que você salvar.
                    </p>
                </div>
                <div className="max-w-xl">
                    <ApiConsulting />
                </div>
            </div>
        </>
    );
}

ApiInspectorCreate.layout = {
    breadcrumbs: [
        {
            title: 'Apis Monitoradas',
            href: apiInspectorIndex(),
        },
        {
            title: 'Adicionar monitor',
            href: apiInspectorCreate(),
        },
    ],
};
