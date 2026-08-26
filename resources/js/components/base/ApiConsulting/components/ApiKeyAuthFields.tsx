import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ApiKeyAuthFieldsProps = {
    headerName: string;
    apiKey: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    configured?: boolean;
    isRotating?: boolean;
    onStartRotating?: () => void;
    onCancelRotating?: () => void;
    onHeaderNameChange: (value: string) => void;
    onApiKeyChange: (value: string) => void;
    onSubmit: () => void;
};

function ApiKeyAuthFields({
    headerName,
    apiKey,
    authErrors,
    isLoading,
    configured = false,
    isRotating = false,
    onStartRotating,
    onCancelRotating,
    onHeaderNameChange,
    onApiKeyChange,
    onSubmit,
}: ApiKeyAuthFieldsProps) {
    const showMasked = configured && !isRotating;

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
                {showMasked ? (
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
                            Alterar API Key
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
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
                        {configured && onCancelRotating !== undefined && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-0"
                                onClick={onCancelRotating}
                                disabled={isLoading}
                            >
                                Manter API Key atual
                            </Button>
                        )}
                    </div>
                )}
                <InputError message={authErrors.apiKey} />
            </div>
        </div>
    );
}

export { ApiKeyAuthFields };
