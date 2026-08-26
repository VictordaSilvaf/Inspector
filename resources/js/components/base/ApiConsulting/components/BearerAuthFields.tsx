import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BearerAuthFieldsProps = {
    token: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    onTokenChange: (value: string) => void;
    onSubmit: () => void;
};

function BearerAuthFields({
    token,
    authErrors,
    isLoading,
    onTokenChange,
    onSubmit,
}: BearerAuthFieldsProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="api-bearer-token">Bearer Token</Label>
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
            <InputError message={authErrors.token} />
        </div>
    );
}

export { BearerAuthFields };
