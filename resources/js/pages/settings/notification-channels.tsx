import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    destroy,
    index as channelsIndex,
    sendVerification,
    store,
    verify,
} from '@/routes/notification-channels';

type NotificationChannelItem = {
    id: number;
    type: string;
    value: string;
    verificationStatus: 'pending' | 'verified' | 'inactive';
    verifiedAt: string | null;
    isActive: boolean;
};

type Props = {
    channels: NotificationChannelItem[];
};

const STATUS_LABELS: Record<NotificationChannelItem['verificationStatus'], string> = {
    pending: 'Pendente',
    verified: 'Verificado',
    inactive: 'Inativo',
};

export default function NotificationChannels({ channels }: Readonly<Props>) {
    const createForm = useForm({
        type: 'email',
        value: '',
    });

    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const verifyForm = useForm({
        code: '',
    });

    return (
        <>
            <Head title="Canais de notificação" />

            <h1 className="sr-only">Canais de notificação</h1>

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title="Canais de notificação"
                    description="Adicione emails verificados para receber alertas das APIs monitoradas."
                />

                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        createForm.post(store.url(), {
                            preserveScroll: true,
                            onSuccess: () => createForm.reset('value'),
                        });
                    }}
                >
                    <div className="space-y-2">
                        <Label htmlFor="channel-email">Email</Label>
                        <Input
                            id="channel-email"
                            type="email"
                            value={createForm.data.value}
                            onChange={(event) =>
                                createForm.setData('value', event.target.value)
                            }
                            placeholder="voce@empresa.com"
                            required
                        />
                        <InputError message={createForm.errors.value} />
                    </div>
                    <Button type="submit" disabled={createForm.processing}>
                        Adicionar canal
                    </Button>
                </form>

                <div className="space-y-3">
                    {channels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum canal cadastrado ainda.
                        </p>
                    ) : (
                        channels.map((channel) => (
                            <div
                                key={channel.id}
                                className="rounded-xl border border-border p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            {channel.value}
                                        </p>
                                        <div className="mt-1 flex gap-2">
                                            <Badge variant="outline">
                                                {channel.type}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    channel.verificationStatus
                                                    === 'verified'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {
                                                    STATUS_LABELS[
                                                        channel
                                                            .verificationStatus
                                                    ]
                                                }
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {channel.verificationStatus
                                            !== 'verified' && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setVerifyingId(
                                                            verifyingId
                                                            === channel.id
                                                                ? null
                                                                : channel.id,
                                                        )
                                                    }
                                                >
                                                    Verificar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            sendVerification.url(
                                                                channel.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    Reenviar código
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                router.delete(
                                                    destroy.url(channel.id),
                                                )
                                            }
                                        >
                                            Remover
                                        </Button>
                                    </div>
                                </div>

                                {verifyingId === channel.id && (
                                    <form
                                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            verifyForm.post(
                                                verify.url(channel.id),
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        verifyForm.reset();
                                                        setVerifyingId(null);
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor={`code-${channel.id}`}>
                                                Código de 6 dígitos
                                            </Label>
                                            <Input
                                                id={`code-${channel.id}`}
                                                value={verifyForm.data.code}
                                                onChange={(event) =>
                                                    verifyForm.setData(
                                                        'code',
                                                        event.target.value,
                                                    )
                                                }
                                                maxLength={6}
                                                inputMode="numeric"
                                                required
                                            />
                                            <InputError
                                                message={verifyForm.errors.code}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={verifyForm.processing}
                                        >
                                            Confirmar
                                        </Button>
                                    </form>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

NotificationChannels.layout = {
    breadcrumbs: [
        {
            title: 'Canais de notificação',
            href: channelsIndex(),
        },
    ],
};
