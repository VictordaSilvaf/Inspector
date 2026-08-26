import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BasicAuthFieldsProps = {
    username: string;
    password: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
};

function BasicAuthFields({
    username,
    password,
    authErrors,
    isLoading,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
}: BasicAuthFieldsProps) {
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
                <InputError message={authErrors.password} />
            </div>
        </div>
    );
}

export { BasicAuthFields };
