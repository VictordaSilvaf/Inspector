import { Head } from '@inertiajs/react';
import {
    create as apiInspectorCreate,
    index as apiInspectorIndex
} from '@/routes/api-inspector';
import { ApiConsulting } from '@/components/base/ApiConsulting';

export default function ApiInspectorCreate() {
    return (
        <>
            <Head title="Criar monitor de API" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mt-16 grid auto-rows-min gap-4 md:grid-cols-3">
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
