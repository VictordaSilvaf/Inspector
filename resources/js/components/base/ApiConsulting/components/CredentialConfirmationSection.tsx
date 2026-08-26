import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CredentialConfirmationSectionProps = {
    currentPassword: string;
    currentPasswordError: string | null;
    isLoading: boolean;
    onCurrentPasswordChange: (value: string) => void;
};

function CredentialConfirmationSection({
    currentPassword,
    currentPasswordError,
    isLoading,
    onCurrentPasswordChange,
}: Readonly<CredentialConfirmationSectionProps>) {
    return (
        <div className="content-box">
            <div className="mb-6">
                <p className="text-xl font-medium">Confirmação de segurança</p>
                <p className="text-sm text-muted-foreground">
                    Confirme sua senha da conta para criar ou alterar credenciais
                    do monitor. É necessário ter autenticação em dois fatores
                    ativa em produção.
                </p>
            </div>
            <div className="max-w-md space-y-2">
                <Label htmlFor="current-password">Sua senha</Label>
                <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    disabled={isLoading}
                    aria-invalid={currentPasswordError !== null}
                    onChange={(event) =>
                        onCurrentPasswordChange(event.target.value)
                    }
                />
                <InputError message={currentPasswordError ?? undefined} />
            </div>
        </div>
    );
}

export { CredentialConfirmationSection };
