const API_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

type ApiHttpMethod = (typeof API_HTTP_METHODS)[number];

const API_MONITOR_INTERVAL_SECONDS = [10, 30, 60] as const;

type ApiMonitorIntervalSeconds = (typeof API_MONITOR_INTERVAL_SECONDS)[number];

const DEFAULT_API_MONITOR_INTERVAL_SECONDS: ApiMonitorIntervalSeconds = 30;

const API_MONITOR_INTERVAL_LABELS: Record<ApiMonitorIntervalSeconds, string> = {
    10: 'A cada 10 segundos',
    30: 'A cada 30 segundos',
    60: 'A cada 60 segundos',
};

const API_AUTH_METHODS = ['basic', 'bearer', 'api-key'] as const;

type ApiAuthMethod = (typeof API_AUTH_METHODS)[number];

type ApiAuthBasic = {
    method: 'basic';
    username: string;
    password: string;
};

type ApiAuthBearer = {
    method: 'bearer';
    token: string;
};

type ApiAuthApiKey = {
    method: 'api-key';
    apiKey: string;
    headerName: string;
};

type ApiAuth = ApiAuthBasic | ApiAuthBearer | ApiAuthApiKey;

const API_AUTH_METHOD_LABELS: Record<ApiAuthMethod, string> = {
    basic: 'Basic Auth',
    bearer: 'Bearer Token',
    'api-key': 'API Key',
};

const DEFAULT_API_KEY_HEADER = 'X-API-Key';

type CustomHeader = {
    id: string;
    key: string;
    value: string;
    configured?: boolean;
    isSensitive?: boolean;
    isRotating?: boolean;
};

function createCustomHeader(): CustomHeader {
    return {
        id: crypto.randomUUID(),
        key: '',
        value: '',
    };
}

function buildApiAuthHeaders(auth: ApiAuth): Headers {
    const headers = new Headers();

    switch (auth.method) {
        case 'basic': {
            const basicToken = btoa(`${auth.username}:${auth.password}`);
            headers.set('Authorization', `Basic ${basicToken}`);
            break;
        }
        case 'bearer':
            headers.set('Authorization', `Bearer ${auth.token}`);
            break;
        case 'api-key':
            headers.set(auth.headerName, auth.apiKey);
            break;
    }

    return headers;
}

function applyCustomHeaders(
    headers: Headers,
    customHeaders: Array<Pick<CustomHeader, 'key' | 'value'>>,
): Headers {
    for (const header of customHeaders) {
        headers.set(header.key, header.value);
    }

    return headers;
}

export {
    API_AUTH_METHOD_LABELS,
    API_AUTH_METHODS,
    API_HTTP_METHODS,
    API_MONITOR_INTERVAL_LABELS,
    API_MONITOR_INTERVAL_SECONDS,
    DEFAULT_API_KEY_HEADER,
    DEFAULT_API_MONITOR_INTERVAL_SECONDS,
    applyCustomHeaders,
    buildApiAuthHeaders,
    createCustomHeader,
    type ApiAuth,
    type ApiAuthMethod,
    type ApiHttpMethod,
    type ApiMonitorIntervalSeconds,
    type CustomHeader,
};
