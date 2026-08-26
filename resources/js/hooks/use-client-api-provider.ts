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
    custom_headers: Array<{ key: string; value: string }> | null;
};

type ServerValidationErrors = Record<string, string>;

type ApiMonitorAuthConfig = {
    username: string;
    password: string;
    token: string;
    apiKey: string;
    headerName: string;
};

type ApiMonitorFormInitialValues = {
    id: number;
    name: string;
    url: string;
    httpMethod: ApiHttpMethod;
    intervalSeconds: ApiMonitorIntervalSeconds;
    authType: 'none' | 'basic' | 'bearer' | 'api_key';
    authConfig: ApiMonitorAuthConfig;
    customHeaders: Array<{ key: string; value: string }>;
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
    const [password, setPassword] = useState(
        initialValues?.authConfig.password ?? '',
    );
    const [token, setToken] = useState(initialValues?.authConfig.token ?? '');
    const [apiKey, setApiKey] = useState(initialValues?.authConfig.apiKey ?? '');
    const [headerName, setHeaderName] = useState(
        initialValues?.authConfig.headerName || DEFAULT_API_KEY_HEADER,
    );
    const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>(
        () =>
            (initialValues?.customHeaders ?? []).map((header) => ({
                ...createCustomHeader(),
                key: header.key,
                value: header.value,
            })),
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
    };

    const removeAuthentication = (): void => {
        setNeedsAdditionalInformation(false);
        setAuthErrors({});
    };

    const updateAuthMethod = (value: ApiAuthMethod): void => {
        setAuthMethod(value);
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

    const buildPayload = async (): Promise<StoreApiMonitorPayload> => {
        if (name.trim() === '') {
            throw new ValidationError('Informe o nome do monitor.');
        }

        const { apiUrl: validatedUrl } = await apiConsultingSchema.validate(
            { apiUrl },
            { abortEarly: true },
        );

        let auth: ApiAuth | undefined;

        if (needsAdditionalInformation) {
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
        }

        const filledHeaders = filterFilledCustomHeaders(customHeaders);
        const validatedCustomHeaders = await customHeadersSchema.validate(
            filledHeaders,
            {
                abortEarly: false,
            },
        );

        return {
            name: name.trim(),
            url: validatedUrl,
            http_method: httpMethod,
            interval_seconds: intervalSeconds,
            auth_type:
                auth !== undefined
                    ? mapAuthMethodToAuthType(auth.method)
                    : 'none',
            auth_config:
                auth !== undefined ? mapAuthToConfig(auth) : null,
            custom_headers:
                validatedCustomHeaders !== undefined
                && validatedCustomHeaders.length > 0
                    ? validatedCustomHeaders.map((header) => ({
                          key: header.key,
                          value: header.value,
                      }))
                    : null,
        };
    };

    const handleSave = async (): Promise<void> => {
        setNameError(null);
        setIntervalError(null);
        setError(null);
        setAuthErrors({});
        setCustomHeaderErrors({});

        try {
            const payload = await buildPayload();

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
        error: error ?? pageErrors?.url ?? null,
        authErrors,
        customHeaderErrors,
        isLoading,
        handleSave,
        needsAdditionalInformation,
        addAuthentication,
        removeAuthentication,
        mode,
    };
}

export {
    useClientApiProvider,
    type ApiMonitorFormInitialValues,
    type UseClientApiProviderOptions,
};
