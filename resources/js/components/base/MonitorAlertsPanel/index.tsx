import { router, useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import {
    destroy as destroyAlert,
    store as storeAlert,
} from '@/routes/api-inspector/alerts';

type NotificationChannelItem = {
    id: number;
    type: string;
    value: string;
    verificationStatus: string;
    isActive: boolean;
};

type AlertSubscriptionItem = {
    id: number;
    notificationChannelId: number;
    isActive: boolean;
    channel: NotificationChannelItem | null;
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
    subscriptions: AlertSubscriptionItem[];
};

type MonitorAlertsPanelProps = {
    monitorId: number;
    alerts: MonitorAlertItem[];
    notificationChannels: NotificationChannelItem[];
};

const TYPE_LABELS: Record<string, string> = {
    availability: 'Indisponibilidade',
    status_code: 'Status HTTP',
    response_time: 'Tempo de resposta',
};

export function MonitorAlertsPanel({
    monitorId,
    alerts,
    notificationChannels,
}: Readonly<MonitorAlertsPanelProps>) {
    const form = useForm({
        name: '',
        type: 'response_time',
        operator: 'greater_than',
        value: '2000',
        cooldown_seconds: 300,
        notification_channel_ids: [] as number[],
    });

    const toggleChannel = (channelId: number): void => {
        const current = form.data.notification_channel_ids;

        if (current.includes(channelId)) {
            form.setData(
                'notification_channel_ids',
                current.filter((id) => id !== channelId),
            );

            return;
        }

        form.setData('notification_channel_ids', [...current, channelId]);
    };

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-medium">Alertas</h2>
                <p className="text-sm text-muted-foreground">
                    Defina condições e emails verificados para receber
                    notificações.
                </p>
            </div>

            <form
                className="space-y-4 rounded-xl border border-border p-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(storeAlert.url(monitorId), {
                        preserveScroll: true,
                        onSuccess: () => {
                            form.reset(
                                'name',
                                'value',
                                'notification_channel_ids',
                            );
                            form.setData({
                                name: '',
                                type: 'response_time',
                                operator: 'greater_than',
                                value: '2000',
                                cooldown_seconds: 300,
                                notification_channel_ids: [],
                            });
                        },
                    });
                }}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="alert-name">Nome (opcional)</Label>
                        <Input
                            id="alert-name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Latência acima de 2s"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                            value={form.data.type}
                            onValueChange={(value) => {
                                form.setData('type', value);

                                if (value === 'availability') {
                                    form.setData('operator', 'equals');
                                    form.setData('value', 'false');
                                }

                                if (value === 'status_code') {
                                    form.setData('operator', 'not_equals');
                                    form.setData('value', '200');
                                }

                                if (value === 'response_time') {
                                    form.setData('operator', 'greater_than');
                                    form.setData('value', '2000');
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="availability">
                                    Indisponibilidade
                                </SelectItem>
                                <SelectItem value="status_code">
                                    Status HTTP
                                </SelectItem>
                                <SelectItem value="response_time">
                                    Tempo de resposta
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Operador</Label>
                        <Select
                            value={form.data.operator}
                            onValueChange={(value) =>
                                form.setData('operator', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equals">Igual</SelectItem>
                                <SelectItem value="not_equals">
                                    Diferente
                                </SelectItem>
                                <SelectItem value="greater_than">
                                    Maior que
                                </SelectItem>
                                <SelectItem value="less_than">
                                    Menor que
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alert-value">Valor</Label>
                        <Input
                            id="alert-value"
                            value={form.data.value}
                            onChange={(event) =>
                                form.setData('value', event.target.value)
                            }
                        />
                        <InputError message={form.errors.value} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alert-cooldown">
                            Cooldown (segundos)
                        </Label>
                        <Input
                            id="alert-cooldown"
                            type="number"
                            min={60}
                            value={form.data.cooldown_seconds}
                            onChange={(event) =>
                                form.setData(
                                    'cooldown_seconds',
                                    Number(event.target.value),
                                )
                            }
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Destinatários verificados</Label>
                    {notificationChannels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Cadastre e verifique um email em Configurações →
                            Notificações.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {notificationChannels.map((channel) => (
                                <label
                                    key={channel.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={form.data.notification_channel_ids.includes(
                                            channel.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleChannel(channel.id)
                                        }
                                    />
                                    {channel.value}
                                </label>
                            ))}
                        </div>
                    )}
                    <InputError
                        message={form.errors.notification_channel_ids}
                    />
                </div>

                <Button type="submit" disabled={form.processing}>
                    Criar alerta
                </Button>
            </form>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nenhum alerta configurado para este monitor.
                    </p>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="rounded-xl border border-border p-4"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {alert.name
                                            ?? TYPE_LABELS[alert.type]
                                            ?? alert.type}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {TYPE_LABELS[alert.type] ?? alert.type}{' '}
                                        · {alert.operator} {alert.value}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge
                                            variant={
                                                alert.state === 'firing'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {alert.state === 'firing'
                                                ? 'Disparando'
                                                : 'OK'}
                                        </Badge>
                                        <Badge variant="outline">
                                            Cooldown {alert.cooldownSeconds}s
                                        </Badge>
                                    </div>
                                    {alert.subscriptions.filter(
                                        (subscription) =>
                                            subscription.isActive,
                                    ).length > 0 && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Destinatários:{' '}
                                            {alert.subscriptions
                                                .filter(
                                                    (subscription) =>
                                                        subscription.isActive,
                                                )
                                                .map(
                                                    (subscription) =>
                                                        subscription.channel
                                                            ?.value,
                                                )
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                        router.delete(
                                            destroyAlert.url({
                                                api_monitor: monitorId,
                                                monitor_alert: alert.id,
                                            }),
                                        )
                                    }
                                >
                                    Remover
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
