import { usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { ApiAuthentication } from '@/components/base/ApiConsulting/components/ApiAuthentication';
import { ApiUrlMonitor } from '@/components/base/ApiConsulting/components/ApiUrlMonitor';
import { CredentialConfirmationSection } from '@/components/base/ApiConsulting/components/CredentialConfirmationSection';
import { CustomHeadersSection } from '@/components/base/ApiConsulting/components/CustomHeadersSection';
import { MonitorIntervalSection } from '@/components/base/ApiConsulting/components/MonitorIntervalSection';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useClientApiProvider


} from '@/hooks/use-client-api-provider';
import type { ApiMonitorFormInitialValues, UseClientApiProviderOptions } from '@/hooks/use-client-api-provider';
import type { ApiMonitorIntervalSeconds } from './auth';

type SharedPlanLimits = {
    allowedIntervals: ApiMonitorIntervalSeconds[];
};

type ApiConsultingProps = {
    initialValues?: ApiMonitorFormInitialValues;
    mode?: UseClientApiProviderOptions['mode'];
    allowedIntervals?: ApiMonitorIntervalSeconds[];
};

function ApiConsulting({
    initialValues,
    mode = 'create',
    allowedIntervals: allowedIntervalsProp,
}: Readonly<ApiConsultingProps>) {
    const { auth } = usePage<{ auth: { planLimits: SharedPlanLimits | null } }>().props;
    const allowedIntervals = allowedIntervalsProp
        ?? auth.planLimits?.allowedIntervals
        ?? [30, 60];
    const {
        name,
        setName,
        nameError,
        apiUrl,
        setApiUrl,
        httpMethod,
        setHttpMethod,
        authMethod,
        setAuthMethod,
        username,
        setUsername,
        password,
        setPassword,
        token,
        setToken,
        apiKey,
        setApiKey,
        headerName,
        setHeaderName,
        customHeaders,
        addCustomHeader,
        removeCustomHeader,
        updateCustomHeader,
        error,
        authErrors,
        customHeaderErrors,
        isLoading,
        handleSave,
        intervalSeconds,
        setIntervalSeconds,
        intervalError,
        needsAdditionalInformation,
        addAuthentication,
        removeAuthentication,
        secretConfigured,
        isRotatingSecret,
        startRotatingSecret,
        cancelRotatingSecret,
        startRotatingCustomHeader,
        cancelRotatingCustomHeader,
        currentPassword,
        setCurrentPassword,
        currentPasswordError,
        requiresCredentialConfirmation,
    } = useClientApiProvider({
        initialValues,
        mode,
    });

    const onSave = (): void => {
        void handleSave();
    };

    const saveLabel =
        mode === 'update' ? 'Atualizar monitor' : 'Salvar monitor';

    return (
        <div className="col-span-full flex flex-col gap-8">
            <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="content-box"
            >
                <div className="mb-6">
                    <p className="text-xl font-medium">Identificação</p>
                    <p className="text-sm text-muted-foreground">
                        Dê um nome para reconhecer este monitor na listagem.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="api-monitor-name">Nome do monitor</Label>
                    <Input
                        id="api-monitor-name"
                        type="text"
                        placeholder="Api de vendas"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={nameError !== null}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSave();
                            }
                        }}
                    />
                    <InputError message={nameError ?? undefined} />
                </div>
            </motion.div>

            <ApiUrlMonitor
                apiUrl={apiUrl}
                httpMethod={httpMethod}
                error={error}
                isLoading={isLoading}
                saveLabel={saveLabel}
                onApiUrlChange={setApiUrl}
                onHttpMethodChange={setHttpMethod}
                onSave={onSave}
            />

            <MonitorIntervalSection
                intervalSeconds={intervalSeconds}
                allowedIntervals={allowedIntervals}
                intervalError={intervalError}
                isLoading={isLoading}
                onIntervalChange={setIntervalSeconds}
            />

            <ApiAuthentication
                needsAdditionalInformation={needsAdditionalInformation}
                authMethod={authMethod}
                username={username}
                password={password}
                token={token}
                apiKey={apiKey}
                headerName={headerName}
                authErrors={authErrors}
                isLoading={isLoading}
                secretConfigured={secretConfigured}
                hasPassword={initialValues?.authConfig.hasPassword ?? false}
                isRotatingSecret={isRotatingSecret}
                onStartRotatingSecret={startRotatingSecret}
                onCancelRotatingSecret={cancelRotatingSecret}
                onAuthMethodChange={setAuthMethod}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onTokenChange={setToken}
                onApiKeyChange={setApiKey}
                onHeaderNameChange={setHeaderName}
                onSubmit={onSave}
                onAddAuthentication={addAuthentication}
                onRemoveAuthentication={removeAuthentication}
            />

            {requiresCredentialConfirmation && (
                <CredentialConfirmationSection
                    currentPassword={currentPassword}
                    currentPasswordError={currentPasswordError}
                    isLoading={isLoading}
                    onCurrentPasswordChange={setCurrentPassword}
                />
            )}

            <CustomHeadersSection
                customHeaders={customHeaders}
                customHeaderErrors={customHeaderErrors}
                isLoading={isLoading}
                onAdd={addCustomHeader}
                onRemove={removeCustomHeader}
                onUpdate={updateCustomHeader}
                onStartRotating={startRotatingCustomHeader}
                onCancelRotating={cancelRotatingCustomHeader}
                onSubmit={onSave}
            />
        </div>
    );
}

export { ApiConsulting };
