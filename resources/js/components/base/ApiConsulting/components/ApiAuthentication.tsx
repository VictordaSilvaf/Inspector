import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
    API_AUTH_METHOD_LABELS,
    API_AUTH_METHODS,
} from '@/components/base/ApiConsulting/auth';
import type { ApiAuthMethod } from '@/components/base/ApiConsulting/auth';
import { ApiKeyAuthFields } from '@/components/base/ApiConsulting/components/ApiKeyAuthFields';
import { BasicAuthFields } from '@/components/base/ApiConsulting/components/BasicAuthFields';
import { BearerAuthFields } from '@/components/base/ApiConsulting/components/BearerAuthFields';
import type { AuthFieldErrors } from '@/components/base/ApiConsulting/schema';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type ApiAuthenticationProps = {
    needsAdditionalInformation: boolean;
    authMethod: ApiAuthMethod;
    username: string;
    password: string;
    token: string;
    apiKey: string;
    headerName: string;
    authErrors: AuthFieldErrors;
    isLoading: boolean;
    secretConfigured?: boolean;
    hasPassword?: boolean;
    isRotatingSecret?: boolean;
    onStartRotatingSecret?: () => void;
    onCancelRotatingSecret?: () => void;
    onAuthMethodChange: (value: ApiAuthMethod) => void;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onTokenChange: (value: string) => void;
    onApiKeyChange: (value: string) => void;
    onHeaderNameChange: (value: string) => void;
    onSubmit: () => void;
    onAddAuthentication: () => void;
    onRemoveAuthentication: () => void;
};

function ApiAuthentication({
    needsAdditionalInformation,
    authMethod,
    username,
    password,
    token,
    apiKey,
    headerName,
    authErrors,
    isLoading,
    secretConfigured = false,
    hasPassword = false,
    isRotatingSecret = false,
    onStartRotatingSecret,
    onCancelRotatingSecret,
    onAuthMethodChange,
    onUsernameChange,
    onPasswordChange,
    onTokenChange,
    onApiKeyChange,
    onHeaderNameChange,
    onSubmit,
    onAddAuthentication,
    onRemoveAuthentication,
}: Readonly<ApiAuthenticationProps>) {
    return (
        <motion.div
            className="content-box"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                duration: 0.5,
                ease: 'easeInOut',
                when: 'afterChildren',
                delay: 0.15,
            }}
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xl font-medium">Autenticação da API</p>
                    <p className="text-sm text-muted-foreground">
                        {needsAdditionalInformation
                            ? 'Escolha o método e informe as credenciais enviadas na requisição.'
                            : 'Adicione autenticação se a API exigir credenciais.'}
                    </p>
                </div>
                {needsAdditionalInformation ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-2 cursor-pointer"
                        onClick={onRemoveAuthentication}
                        disabled={isLoading}
                    >
                        <Trash2 className="size-4" />
                        Remover
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-2 cursor-pointer"
                        onClick={onAddAuthentication}
                        disabled={isLoading}
                    >
                        <Plus className="size-4" />
                        Adicionar
                    </Button>
                )}
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
                {needsAdditionalInformation ? (
                    <motion.div
                        key="authentication-fields"
                        className="space-y-5"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="api-auth-method">
                                Método de autenticação
                            </Label>
                            <Select
                                value={authMethod}
                                onValueChange={(value) =>
                                    onAuthMethodChange(value as ApiAuthMethod)
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger
                                    id="api-auth-method"
                                    className="w-full sm:w-72"
                                    aria-invalid={
                                        authErrors.method !== undefined
                                    }
                                >
                                    <SelectValue placeholder="Selecione o método" />
                                </SelectTrigger>
                                <SelectContent>
                                    {API_AUTH_METHODS.map((method) => (
                                        <SelectItem
                                            key={method}
                                            value={method}
                                        >
                                            {API_AUTH_METHOD_LABELS[method]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={authErrors.method} />
                        </div>

                        {authMethod === 'basic' && (
                            <BasicAuthFields
                                username={username}
                                password={password}
                                authErrors={authErrors}
                                isLoading={isLoading}
                                hasPassword={hasPassword}
                                isRotating={isRotatingSecret}
                                onStartRotating={onStartRotatingSecret}
                                onCancelRotating={onCancelRotatingSecret}
                                onUsernameChange={onUsernameChange}
                                onPasswordChange={onPasswordChange}
                                onSubmit={onSubmit}
                            />
                        )}

                        {authMethod === 'bearer' && (
                            <BearerAuthFields
                                token={token}
                                authErrors={authErrors}
                                isLoading={isLoading}
                                configured={secretConfigured}
                                isRotating={isRotatingSecret}
                                onStartRotating={onStartRotatingSecret}
                                onCancelRotating={onCancelRotatingSecret}
                                onTokenChange={onTokenChange}
                                onSubmit={onSubmit}
                            />
                        )}

                        {authMethod === 'api-key' && (
                            <ApiKeyAuthFields
                                headerName={headerName}
                                apiKey={apiKey}
                                authErrors={authErrors}
                                isLoading={isLoading}
                                configured={secretConfigured}
                                isRotating={isRotatingSecret}
                                onStartRotating={onStartRotatingSecret}
                                onCancelRotating={onCancelRotatingSecret}
                                onHeaderNameChange={onHeaderNameChange}
                                onApiKeyChange={onApiKeyChange}
                                onSubmit={onSubmit}
                            />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="authentication-empty"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-md bg-muted p-4"
                    >
                        <p className="text-center text-sm text-muted-foreground">
                            Nenhuma autenticação. Clique em Adicionar se a API
                            precisar.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export { ApiAuthentication };
