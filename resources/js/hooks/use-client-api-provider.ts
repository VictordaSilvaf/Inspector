import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ValidationError } from 'yup';
import {
    store as storeApiMonitor,
    update as updateApiMonitor,
} from '@/routes/api-inspector';
import {
    createCustomHeader,
    DEFAULT_API_KEY_HEADER,
    DEFAULT_API_MONITOR_INTERVAL_SECONDS,
} from '@/components/base/ApiConsulting/auth';
import type {
    ApiAuth,
    ApiAuthMethod,
    ApiHttpMethod,
    ApiMonitorIntervalSeconds,
    CustomHeader,
} from '@/components/base/ApiConsulting/auth';
import {
    apiAuthSchema,
    apiConsultingSchema,
    customHeadersSchema,
    filterFilledCustomHeaders,
    isAuthValidationError,
    isCustomHeaderValidationError,
    mapAuthValidationErrors,
    mapCustomHeaderValidationErrors,
    toApiAuth,
} from '@/components/base/ApiConsulting/schema';
import type {
    AuthFieldErrors,
    CustomHeaderErrors,
} from '@/components/base/ApiConsulting/schema';

type StoreApiMonitorPayload = {
    name: string;
    url: string;
    http_method: ApiHttpMethod;
    interval_seconds: ApiMonitorIntervalSeconds;
    auth_type: 'none' | 'basic' | 'bearer' | 'api_key';
    auth_config: Record<string, string> | null;
    custom_headers: Array<{ key: string; value?: string }> | null;
    current_password?: string;
};

type ServerValidationErrors = Record<string, string>;

type ApiMonitorAuthConfig = {
    username?: string;
    hasPassword?: boolean;
    configured?: boolean;
    headerName?: string;
};

type ApiMonitorCustomHeader = {
    name: string;
    configured: boolean;
    isSensitive: boolean;
    value?: string;
};

type ApiMonitorFormInitialValues = {
    id: number;
    name: string;
    url: string;
    httpMethod: ApiHttpMethod;
    intervalSeconds: ApiMonitorIntervalSeconds;
    authType: 'none' | 'basic' | 'bearer' | 'api_key';
    authConfig: ApiMonitorAuthConfig;
    customHeaders: ApiMonitorCustomHeader[];
};

type UseClientApiProviderOptions = {
    initialValues?: ApiMonitorFormInitialValues;
    mode?: 'create' | 'update';
};

function mapAuthMethodToAuthType(
    authMethod: ApiAuthMethod,
): StoreApiMonitorPayload['auth_type'] {
    if (authMethod === 'api-key') {
        return 'api_key';
    }

    return authMethod;
}

function mapAuthTypeToAuthMethod(
    authType: ApiMonitorFormInitialValues['authType'],
): ApiAuthMethod {
    if (authType === 'api_key') {
        return 'api-key';
    }

    if (authType === 'basic') {
        return 'basic';
    }

    return 'bearer';
}

function mapAuthToConfig(auth: ApiAuth): Record<string, string> {
    switch (auth.method) {
        case 'basic':
            return {
                username: auth.username,
                password: auth.password,
            };
        case 'bearer':
            return {
                token: auth.token,
            };
        case 'api-key':
            return {
                api_key: auth.apiKey,
                header_name: auth.headerName,
            };
    }
}

function mapServerErrors(errors: ServerValidationErrors): {
    nameError: string | null;
    urlError: string | null;
    intervalError: string | null;
    authErrors: AuthFieldErrors;
    customHeaderErrors: CustomHeaderErrors;
} {
    const authErrors: AuthFieldErrors = {};

    if (errors['auth_config.username']) {
        authErrors.username = errors['auth_config.username'];
    }

    if (errors['auth_config.password']) {
        authErrors.password = errors['auth_config.password'];
    }

    if (errors['auth_config.token']) {
        authErrors.token = errors['auth_config.token'];
    }

    if (errors['auth_config.api_key']) {
        authErrors.apiKey = errors['auth_config.api_key'];
    }

    if (errors['auth_config.header_name']) {
        authErrors.headerName = errors['auth_config.header_name'];
    }

    if (errors.auth_type) {
        authErrors.method = errors.auth_type;
    }

    const customHeaderFormError = errors.custom_headers;
    const customHeaderErrors: CustomHeaderErrors = customHeaderFormError
        ? { form: customHeaderFormError }
        : {};

    return {
        nameError: errors.name ?? null,
        urlError: errors.url ?? null,
        intervalError: errors.interval_seconds ?? null,
        authErrors,
        customHeaderErrors,
        currentPasswordError: errors.current_password ?? errors.rate_limit ?? null,
    };
}

function resolveInitialInterval(
    intervalSeconds: number | undefined,
): ApiMonitorIntervalSeconds {
    if (intervalSeconds === 10 || intervalSeconds === 30 || intervalSeconds === 60) {
        return intervalSeconds;
    }

    return DEFAULT_API_MONITOR_INTERVAL_SECONDS;
}

function mapServerCustomHeaders(
    headers: ApiMonitorCustomHeader[],
): CustomHeader[] {
    return headers.map((header) => ({
        ...createCustomHeader(),
        key: header.name,
        value: header.isSensitive ? '' : (header.value ?? ''),
        configured: header.configured,
        isSensitive: header.isSensitive,
        isRotating: false,
    }));
}

function requiresCurrentPassword(
    mode: 'create' | 'update',
    needsAdditionalInformation: boolean,
    isRotatingSecret: boolean,
    initialValues: ApiMonitorFormInitialValues | undefined,
    authMethod: ApiAuthMethod,
): boolean {
    if (mode === 'create') {
        return needsAdditionalInformation;
    }

    if (initialValues === undefined) {
        return false;
    }

    if (isRotatingSecret) {
        return true;
    }

    if (!needsAdditionalInformation && initialValues.authType !== 'none') {
        return true;
    }

    const nextAuthType = mapAuthMethodToAuthType(authMethod);

    if (nextAuthType !== initialValues.authType) {
        return initialValues.authType !== 'none' || nextAuthType !== 'none';
    }

    return false;
}

function useClientApiProvider(options: UseClientApiProviderOptions = {}) {
    const { initialValues, mode = 'create' } = options;
    const { errors: pageErrors } = usePage<{ errors: ServerValidationErrors }>()
        .props;

    const [name, setName] = useState(initialValues?.name ?? '');
    const [apiUrl, setApiUrl] = useState(initialValues?.url ?? '');
    const [httpMethod, setHttpMethod] = useState<ApiHttpMethod>(
        initialValues?.httpMethod ?? 'GET',
    );
    const [intervalSeconds, setIntervalSeconds] =
        useState<ApiMonitorIntervalSeconds>(
            resolveInitialInterval(initialValues?.intervalSeconds),
        );
    const [authMethod, setAuthMethod] = useState<ApiAuthMethod>(
        initialValues !== undefined
            ? mapAuthTypeToAuthMethod(initialValues.authType)
            : 'bearer',
    );
    const [username, setUsername] = useState(
        initialValues?.authConfig.username ?? '',
    );
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [headerName, setHeaderName] = useState(
        initialValues?.authConfig.headerName || DEFAULT_API_KEY_HEADER,
    );
    const [isRotatingSecret, setIsRotatingSecret] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
    const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>(() =>
        initialValues !== undefined
            ? mapServerCustomHeaders(initialValues.customHeaders)
            : [],
    );
    const [nameError, setNameError] = useState<string | null>(null);
    const [intervalError, setIntervalError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authErrors, setAuthErrors] = useState<AuthFieldErrors>({});
    const [customHeaderErrors, setCustomHeaderErrors] =
        useState<CustomHeaderErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [needsAdditionalInformation, setNeedsAdditionalInformation] =
        useState(
            initialValues !== undefined
                ? initialValues.authType !== 'none'
                : false,
        );

    const secretConfigured =
        mode === 'update'
        && (initialValues?.authConfig.configured
            || initialValues?.authConfig.hasPassword
            || false);

    const requiresCredentialConfirmation = requiresCurrentPassword(
        mode,
        needsAdditionalInformation,
        isRotatingSecret,
        initialValues,
        authMethod,
    );

    const clearAuthFieldError = (field: keyof AuthFieldErrors): void => {
        if (authErrors[field] !== undefined) {
            setAuthErrors((current) => ({
                ...current,
                [field]: undefined,
            }));
        }
    };

    const updateName = (value: string): void => {
        setName(value);

        if (nameError !== null) {
            setNameError(null);
        }
    };

    const updateApiUrl = (value: string): void => {
        setApiUrl(value);

        if (error !== null) {
            setError(null);
        }
    };

    const updateHttpMethod = (value: ApiHttpMethod): void => {
        setHttpMethod(value);
    };

    const updateIntervalSeconds = (value: ApiMonitorIntervalSeconds): void => {
        setIntervalSeconds(value);

        if (intervalError !== null) {
            setIntervalError(null);
        }
    };

    const addAuthentication = (): void => {
        setNeedsAdditionalInformation(true);
        setAuthErrors({});
        setIsRotatingSecret(false);
    };

    const removeAuthentication = (): void => {
        setNeedsAdditionalInformation(false);
        setAuthErrors({});
        setIsRotatingSecret(false);
        setPassword('');
        setToken('');
        setApiKey('');
    };

    const updateAuthMethod = (value: ApiAuthMethod): void => {
        setAuthMethod(value);
        setAuthErrors({});
        setIsRotatingSecret(false);
        setPassword('');
        setToken('');
        setApiKey('');
    };

    const startRotatingSecret = (): void => {
        setIsRotatingSecret(true);
        setPassword('');
        setToken('');
        setApiKey('');
        setAuthErrors({});
    };

    const cancelRotatingSecret = (): void => {
        setIsRotatingSecret(false);
        setPassword('');
        setToken('');
        setApiKey('');
        setAuthErrors({});
    };

    const updateUsername = (value: string): void => {
        setUsername(value);
        clearAuthFieldError('username');
    };

    const updatePassword = (value: string): void => {
        setPassword(value);
        clearAuthFieldError('password');
    };

    const updateToken = (value: string): void => {
        setToken(value);
        clearAuthFieldError('token');
    };

    const updateApiKey = (value: string): void => {
        setApiKey(value);
        clearAuthFieldError('apiKey');
    };

    const updateHeaderName = (value: string): void => {
        setHeaderName(value);
        clearAuthFieldError('headerName');
    };

    const addCustomHeader = (): void => {
        setCustomHeaders((current) => [...current, createCustomHeader()]);
    };

    const removeCustomHeader = (id: string): void => {
        setCustomHeaders((current) =>
            current.filter((header) => header.id !== id),
        );
        setCustomHeaderErrors((current) => {
            if (current.fields === undefined) {
                return { form: current.form };
            }

            const fields = { ...current.fields };
            delete fields[id];

            return {
                form: current.form,
                fields,
            };
        });
    };

    const updateCustomHeader = (
        id: string,
        field: 'key' | 'value',
        value: string,
    ): void => {
        setCustomHeaders((current) =>
            current.map((header) =>
                header.id === id ? { ...header, [field]: value } : header,
            ),
        );

        if (customHeaderErrors.fields?.[id]?.[field] !== undefined) {
            setCustomHeaderErrors((current) => ({
                ...current,
                fields: {
                    ...current.fields,
                    [id]: {
                        ...current.fields?.[id],
                        [field]: undefined,
                    },
                },
                form: undefined,
            }));
        }
    };

    const startRotatingCustomHeader = (id: string): void => {
        setCustomHeaders((current) =>
            current.map((header) =>
                header.id === id
                    ? { ...header, isRotating: true, value: '' }
                    : header,
            ),
        );
    };

    const cancelRotatingCustomHeader = (id: string): void => {
        setCustomHeaders((current) =>
            current.map((header) =>
                header.id === id
                    ? { ...header, isRotating: false, value: '' }
                    : header,
            ),
        );
    };

    const buildPayload = async (): Promise<StoreApiMonitorPayload> => {
        if (name.trim() === '') {
            throw new ValidationError('Informe o nome do monitor.');
        }

        const { apiUrl: validatedUrl } = await apiConsultingSchema.validate(
            { apiUrl },
            { abortEarly: true },
        );

        let auth: ApiAuth | undefined;
        const requiresSecretInput =
            mode === 'create'
            || isRotatingSecret
            || (needsAdditionalInformation && !secretConfigured);

        if (needsAdditionalInformation) {
            if (requiresSecretInput) {
                const validatedAuth = await apiAuthSchema.validate(
                    {
                        method: authMethod,
                        username,
                        password,
                        token,
                        apiKey,
                        headerName,
                    },
                    { abortEarly: false },
                );

                auth = toApiAuth(validatedAuth);
            } else {
                if (authMethod === 'basic' && username.trim() === '') {
                    throw new ValidationError('Informe o usuário da API.');
                }

                if (authMethod === 'api-key' && headerName.trim() === '') {
                    throw new ValidationError(
                        'Informe o nome do header da API Key.',
                    );
                }

                auth = toApiAuth({
                    method: authMethod,
                    username,
                    password: '',
                    token: '',
                    apiKey: '',
                    headerName,
                });
            }
        }

        const filledHeaders = filterFilledCustomHeaders(customHeaders);
        const headersForValidation = filledHeaders.filter((header) => {
            if (mode === 'update' && header.configured && header.isSensitive && !header.isRotating) {
                return header.key.trim() !== '';
            }

            return true;
        });

        if (headersForValidation.length > 0) {
            await customHeadersSchema.validate(headersForValidation, {
                abortEarly: false,
            });
        }

        const payloadHeaders = filledHeaders.map((header) => {
            const item: { key: string; value?: string } = {
                key: header.key.trim(),
            };

            if (
                mode === 'update'
                && header.configured
                && header.isSensitive
                && !header.isRotating
                && header.value.trim() === ''
            ) {
                return item;
            }

            if (header.value.trim() !== '') {
                item.value = header.value;
            }

            return item;
        });

        const authConfig =
            auth !== undefined ? mapAuthToConfig(auth) : null;

        if (authConfig !== null && mode === 'update' && !requiresSecretInput) {
            if (authMethod === 'bearer') {
                delete authConfig.token;
            }

            if (authMethod === 'basic') {
                delete authConfig.password;
            }

            if (authMethod === 'api-key') {
                delete authConfig.api_key;
            }
        }

        return {
            name: name.trim(),
            url: validatedUrl,
            http_method: httpMethod,
            interval_seconds: intervalSeconds,
            auth_type:
                auth !== undefined
                    ? mapAuthMethodToAuthType(auth.method)
                    : 'none',
            auth_config: authConfig,
            custom_headers:
                payloadHeaders.length > 0 ? payloadHeaders : null,
            ...(requiresCredentialConfirmation && currentPassword !== ''
                ? { current_password: currentPassword }
                : {}),
        };
    };

    const handleSave = async (): Promise<void> => {
        setNameError(null);
        setIntervalError(null);
        setError(null);
        setAuthErrors({});
        setCustomHeaderErrors({});
        setCurrentPasswordError(null);

        try {
            const payload = await buildPayload();

            if (requiresCredentialConfirmation && currentPassword.trim() === '') {
                setCurrentPasswordError('Confirme sua senha para alterar credenciais.');

                return;
            }

            setIsLoading(true);

            if (mode === 'update' && initialValues !== undefined) {
                router.put(updateApiMonitor.url(initialValues.id), payload, {
                    onError: (errors) => {
                        const mappedErrors = mapServerErrors(errors);
                        setNameError(mappedErrors.nameError);
                        setIntervalError(mappedErrors.intervalError);
                        setError(mappedErrors.urlError);
                        setAuthErrors(mappedErrors.authErrors);
                        setCustomHeaderErrors(mappedErrors.customHeaderErrors);
                        setCurrentPasswordError(mappedErrors.currentPasswordError);
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    },
                });

                return;
            }

            router.post(storeApiMonitor.url(), payload, {
                onError: (errors) => {
                    const mappedErrors = mapServerErrors(errors);
                    setNameError(mappedErrors.nameError);
                    setIntervalError(mappedErrors.intervalError);
                    setError(mappedErrors.urlError);
                    setAuthErrors(mappedErrors.authErrors);
                    setCustomHeaderErrors(mappedErrors.customHeaderErrors);
                    setCurrentPasswordError(mappedErrors.currentPasswordError);
                },
                onFinish: () => {
                    setIsLoading(false);
                },
            });
        } catch (caughtError) {
            if (caughtError instanceof ValidationError) {
                if (caughtError.message === 'Informe o nome do monitor.') {
                    setNameError(caughtError.message);

                    return;
                }

                if (isAuthValidationError(caughtError)) {
                    setAuthErrors(mapAuthValidationErrors(caughtError));

                    return;
                }

                if (isCustomHeaderValidationError(caughtError)) {
                    setCustomHeaderErrors(
                        mapCustomHeaderValidationErrors(
                            caughtError,
                            customHeaders,
                        ),
                    );

                    return;
                }

                setError(caughtError.message);
            }
        }
    };

    return {
        name,
        setName: updateName,
        nameError: nameError ?? pageErrors?.name ?? null,
        apiUrl,
        setApiUrl: updateApiUrl,
        httpMethod,
        setHttpMethod: updateHttpMethod,
        intervalSeconds,
        setIntervalSeconds: updateIntervalSeconds,
        intervalError: intervalError ?? pageErrors?.interval_seconds ?? null,
        authMethod,
        setAuthMethod: updateAuthMethod,
        username,
        setUsername: updateUsername,
        password,
        setPassword: updatePassword,
        token,
        setToken: updateToken,
        apiKey,
        setApiKey: updateApiKey,
        headerName,
        setHeaderName: updateHeaderName,
        customHeaders,
        addCustomHeader,
        removeCustomHeader,
        updateCustomHeader,
        startRotatingCustomHeader,
        cancelRotatingCustomHeader,
        error: error ?? pageErrors?.url ?? null,
        authErrors,
        customHeaderErrors,
        isLoading,
        handleSave,
        needsAdditionalInformation,
        addAuthentication,
        removeAuthentication,
        secretConfigured,
        isRotatingSecret,
        startRotatingSecret,
        cancelRotatingSecret,
        currentPassword,
        setCurrentPassword: (value: string) => {
            setCurrentPassword(value);
            if (currentPasswordError !== null) {
                setCurrentPasswordError(null);
            }
        },
        currentPasswordError: currentPasswordError ?? pageErrors?.current_password ?? pageErrors?.rate_limit ?? null,
        requiresCredentialConfirmation,
        mode,
    };
}

export {
    useClientApiProvider,
    type ApiMonitorFormInitialValues,
    type UseClientApiProviderOptions,
};
