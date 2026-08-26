import { router } from '@inertiajs/react';
import SeoHead from '@/components/seo-head';
import { Button } from '@/components/ui/button';

type UnsubscribeProps = {
    token: string;
    alreadyUnsubscribed: boolean;
    monitorName: string | null;
    alertName: string | null;
    channelValue: string | null;
};

export default function Unsubscribe({
    token,
    alreadyUnsubscribed,
    monitorName,
    alertName,
    channelValue,
}: Readonly<UnsubscribeProps>) {
    return (
        <>
            <SeoHead title="Cancelar inscrição" />
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md space-y-4 rounded-xl border border-border p-6 text-center">
                    <h1 className="text-xl font-semibold">
                        Cancelar inscrição de alerta
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {alreadyUnsubscribed
                            ? 'Esta inscrição já foi cancelada.'
                            : `Cancelar notificações de “${alertName ?? 'alerta'}” para ${channelValue ?? 'este canal'} no monitor ${monitorName ?? 'API'}?`}
                    </p>
                    {! alreadyUnsubscribed && (
                        <Button
                            onClick={() =>
                                router.post(`/unsubscribe/${token}`)
                            }
                        >
                            Confirmar cancelamento
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
