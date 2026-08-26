import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ApiKeyAuthFieldsProps = {
    headerName: string;
    apiKey: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    onHeaderNameChange: (value: string) => void;
    onApiKeyChange: (value: string) => void;
    onSubmit: () => void;
};

function ApiKeyAuthFields({
    headerName,
    apiKey,
    authErrors,
    isLoading,
    onHeaderNameChange,
    onApiKeyChange,
    onSubmit,
}: ApiKeyAuthFieldsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="api-key-header">Header</Label>
                <Input
                    id="api-key-header"
                    type="text"
                    placeholder="X-API-Key"
                    value={headerName}
                    onChange={(e) => onHeaderNameChange(e.target.value)}
                    aria-invalid={authErrors.headerName !== undefined}
                    disabled={isLoading}
                />
                <InputError message={authErrors.headerName} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="api-key-value">API Key</Label>
                <Input
                    id="api-key-value"
                    type="password"
                    autoComplete="off"
                    placeholder="sua-api-key"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    aria-invalid={authErrors.apiKey !== undefined}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSubmit();
                        }
                    }}
                />
                <InputError message={authErrors.apiKey} />
            </div>
        </div>
    );
}

export { ApiKeyAuthFields };
