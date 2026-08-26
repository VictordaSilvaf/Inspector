import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BasicAuthFieldsProps = {
    username: string;
    password: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    hasPassword?: boolean;
    isRotating?: boolean;
    onStartRotating?: () => void;
    onCancelRotating?: () => void;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
};

function BasicAuthFields({
    username,
    password,
    authErrors,
    isLoading,
    hasPassword = false,
    isRotating = false,
    onStartRotating,
    onCancelRotating,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
}: BasicAuthFieldsProps) {
    const showMaskedPassword = hasPassword && !isRotating;

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="api-username">Usuário</Label>
                <Input
                    id="api-username"
                    type="text"
                    autoComplete="username"
                    placeholder="usuário"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    aria-invalid={authErrors.username !== undefined}
                    disabled={isLoading}
                />
                <InputError message={authErrors.username} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="api-password">Senha</Label>
                {showMaskedPassword ? (
                    <div className="flex flex-col gap-2">
                        <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                            ••••••••••••••••
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onStartRotating}
                            disabled={isLoading}
                        >
                            Alterar senha
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Input
                            id="api-password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="senha"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            aria-invalid={authErrors.password !== undefined}
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSubmit();
                                }
                            }}
                        />
                        {hasPassword && onCancelRotating !== undefined && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-0"
                                onClick={onCancelRotating}
                                disabled={isLoading}
                            >
                                Manter senha atual
                            </Button>
                        )}
                    </div>
                )}
                <InputError message={authErrors.password} />
            </div>
        </div>
    );
}

export { BasicAuthFields };
