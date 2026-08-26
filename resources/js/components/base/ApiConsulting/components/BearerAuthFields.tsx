import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BearerAuthFieldsProps = {
    token: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    configured?: boolean;
    isRotating?: boolean;
    onStartRotating?: () => void;
    onCancelRotating?: () => void;
    onTokenChange: (value: string) => void;
    onSubmit: () => void;
};

function BearerAuthFields({
    token,
    authErrors,
    isLoading,
    configured = false,
    isRotating = false,
    onStartRotating,
    onCancelRotating,
    onTokenChange,
    onSubmit,
}: BearerAuthFieldsProps) {
    const showMasked = configured && !isRotating;

    return (
        <div className="space-y-2">
            <Label htmlFor="api-bearer-token">Bearer Token</Label>
            {showMasked ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                        ••••••••••••••••
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onStartRotating}
                        disabled={isLoading}
                    >
                        Alterar token
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    <Input
                        id="api-bearer-token"
                        type="password"
                        autoComplete="off"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={token}
                        onChange={(e) => onTokenChange(e.target.value)}
                        aria-invalid={authErrors.token !== undefined}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSubmit();
                            }
                        }}
                    />
                    {configured && onCancelRotating !== undefined && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="px-0"
                            onClick={onCancelRotating}
                            disabled={isLoading}
                        >
                            Manter token atual
                        </Button>
                    )}
                </div>
            )}
            <InputError message={authErrors.token} />
        </div>
    );
}

export { BearerAuthFields };
