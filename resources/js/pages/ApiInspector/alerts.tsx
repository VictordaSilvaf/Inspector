import { Head, router } from '@inertiajs/react';
import { ArrowLeftIcon } from 'lucide-react';
import { index as apiInspectorIndex, show as apiInspectorShow } from '@/routes/api-inspector';
import { MonitorAlertsPanel } from '@/components/base/MonitorAlertsPanel';
import { Button } from '@/components/ui/button';

type NotificationChannelItem = {
    id: number;
    type: string;
    value: string;
    verificationStatus: string;
    isActive: boolean;
};

type MonitorAlertItem = {
    id: number;
    name: string | null;
    type: string;
    operator: string;
    value: string;
    cooldownSeconds: number;
    isActive: boolean;
    state: string;
    subscriptions: Array<{
        id: number;
        notificationChannelId: number;
        isActive: boolean;
        channel: NotificationChannelItem | null;
    }>;
};

type ApiInspectorAlertsProps = {
    monitor: {
        id: number;
        name: string;
        url: string;
    };
    alerts: MonitorAlertItem[];
    notificationChannels: NotificationChannelItem[];
};

export default function ApiInspectorAlerts({
    monitor,
    alerts,
    notificationChannels,
}: Readonly<ApiInspectorAlertsProps>) {
    return (
        <>
            <Head title={`${monitor.name} · Alertas`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="mt-4 flex flex-col gap-3">
                    <Button
                        variant="ghost"
                        className="w-fit px-0"
                        onClick={() =>
                            router.visit(apiInspectorShow.url(monitor.id))
                        }
                    >
                        <ArrowLeftIcon className="size-4" />
                        Voltar para detalhes
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Alertas</h1>
                        <p className="mt-1 text-muted-foreground">
                            {monitor.name} · {monitor.url}
                        </p>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Configure quantas regras quiser para esta API. Cada
                            alerta tem sua própria condição, cooldown e
                            destinatários.
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    <MonitorAlertsPanel
                        monitorId={monitor.id}
                        alerts={alerts}
                        notificationChannels={notificationChannels}
                    />
                </div>
            </div>
        </>
    );
}

ApiInspectorAlerts.layout = {
    breadcrumbs: [
        {
            title: 'Apis Monitoradas',
            href: apiInspectorIndex(),
        },
        {
            title: 'Alertas',
            href: '#',
        },
    ],
};
