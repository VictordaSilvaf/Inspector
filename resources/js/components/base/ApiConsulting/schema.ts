import { array, mixed, object, string } from 'yup';
import type { InferType, ValidationError } from 'yup';
import {
    API_AUTH_METHODS,
    DEFAULT_API_KEY_HEADER,
} from '@/components/base/ApiConsulting/auth';
import type {
    ApiAuth,
    ApiAuthMethod,
    CustomHeader,
} from '@/components/base/ApiConsulting/auth';

const apiConsultingSchema = object({
    apiUrl: string()
        .trim()
        .required('Informe o endereço da API.')
        .url('Informe uma URL válida (ex.: https://api.exemplo.com).')
        .matches(
            /^https?:\/\//i,
            'A URL deve começar com http:// ou https://.',
        )
        .test(
            'no-whitespace',
            'A URL não pode conter espaços.',
            (value) => value === undefined || !/\s/.test(value),
        ),
});

const apiAuthSchema = object({
    method: mixed<ApiAuthMethod>()
        .oneOf([...API_AUTH_METHODS], 'Selecione um método de autenticação.')
        .required('Selecione um método de autenticação.'),
    username: string().when('method', {
        is: 'basic',
        then: (schema) =>
            schema.trim().required('Informe o usuário da API.'),
        otherwise: (schema) => schema.strip(),
    }),
    password: string().when('method', {
        is: 'basic',
        then: (schema) => schema.required('Informe a senha da API.'),
        otherwise: (schema) => schema.strip(),
    }),
    token: string().when('method', {
        is: 'bearer',
        then: (schema) =>
            schema.trim().required('Informe o token Bearer da API.'),
        otherwise: (schema) => schema.strip(),
    }),
    apiKey: string().when('method', {
        is: 'api-key',
        then: (schema) => schema.trim().required('Informe a API Key.'),
        otherwise: (schema) => schema.strip(),
    }),
    headerName: string().when('method', {
        is: 'api-key',
        then: (schema) =>
            schema
                .trim()
                .required('Informe o nome do header da API Key.')
                .default(DEFAULT_API_KEY_HEADER),
        otherwise: (schema) => schema.strip(),
    }),
});

type ApiConsultingForm = InferType<typeof apiConsultingSchema>;
type ApiAuthForm = InferType<typeof apiAuthSchema>;

function toApiAuth(form: ApiAuthForm): ApiAuth {
    switch (form.method) {
        case 'basic':
            return {
                method: 'basic',
                username: form.username ?? '',
                password: form.password ?? '',
            };
        case 'bearer':
            return {
                method: 'bearer',
                token: form.token ?? '',
            };
        case 'api-key':
            return {
                method: 'api-key',
                apiKey: form.apiKey ?? '',
                headerName: form.headerName || DEFAULT_API_KEY_HEADER,
            };
    }
}

const AUTH_FIELD_PATHS = [
    'method',
    'username',
    'password',
    'token',
    'apiKey',
    'headerName',
] as const;

type AuthFieldPath = (typeof AUTH_FIELD_PATHS)[number];
type AuthFieldErrors = Partial<Record<AuthFieldPath, string>>;

function isAuthFieldPath(path: string | undefined): path is AuthFieldPath {
    return (
        path !== undefined &&
        (AUTH_FIELD_PATHS as readonly string[]).includes(path)
    );
}

const customHeaderSchema = object({
    id: string().required(),
    key: string()
        .trim()
        .required('Informe o nome do header.')
        .matches(
            /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/,
            'Informe um nome de header válido.',
        ),
    value: string().required('Informe o valor do header.'),
});

const customHeadersSchema = array()
    .of(customHeaderSchema)
    .test(
        'unique-header-keys',
        'Há headers com o mesmo nome. Remova as duplicatas.',
        (headers) => {
            if (headers === undefined) {
                return true;
            }

            const keys = headers
                .map((header) => header.key?.trim().toLowerCase())
                .filter((key): key is string => Boolean(key));

            return new Set(keys).size === keys.length;
        },
    );

type CustomHeaderForm = InferType<typeof customHeaderSchema>;
type CustomHeaderErrors = {
    form?: string;
    fields?: Record<string, Partial<Record<'key' | 'value', string>>>;
};

function filterFilledCustomHeaders(
    headers: CustomHeader[],
): CustomHeader[] {
    return headers.filter(
        (header) => header.key.trim() !== '' || header.value.trim() !== '',
    );
}

function mapAuthValidationErrors(
    validationError: ValidationError,
): AuthFieldErrors {
    const nextErrors: AuthFieldErrors = {};

    for (const inner of validationError.inner.length > 0
        ? validationError.inner
        : [validationError]) {
        if (isAuthFieldPath(inner.path)) {
            nextErrors[inner.path] = inner.message;
        }
    }

    return nextErrors;
}

function mapCustomHeaderValidationErrors(
    validationError: ValidationError,
    headers: CustomHeader[],
): CustomHeaderErrors {
    if (validationError.type === 'unique-header-keys') {
        return { form: validationError.message };
    }

    const fields: Record<string, Partial<Record<'key' | 'value', string>>> =
        {};
    const filledHeaders = filterFilledCustomHeaders(headers);
    const headerPathPattern = /^\[(\d+)\]\.(key|value)$/;
    let form: string | undefined;

    for (const inner of validationError.inner.length > 0
        ? validationError.inner
        : [validationError]) {
        const match = headerPathPattern.exec(inner.path ?? '');

        if (match === null) {
            if (
                inner.type === 'unique-header-keys' ||
                inner.path === undefined
            ) {
                form = inner.message;
            }

            continue;
        }

        const index = Number(match[1]);
        const field = match[2] as 'key' | 'value';
        const header = filledHeaders[index];

        if (header === undefined) {
            continue;
        }

        fields[header.id] = {
            ...fields[header.id],
            [field]: inner.message,
        };
    }

    return { form, fields };
}

function isAuthValidationError(validationError: ValidationError): boolean {
    return (
        isAuthFieldPath(validationError.path) ||
        validationError.inner.some((inner) => isAuthFieldPath(inner.path))
    );
}

function isCustomHeaderValidationError(
    validationError: ValidationError,
): boolean {
    if (validationError.type === 'unique-header-keys') {
        return true;
    }

    if (validationError.path?.startsWith('[') === true) {
        return true;
    }

    return validationError.inner.some((inner) =>
        /^\[\d+\]\.(key|value)$/.test(inner.path ?? ''),
    );
}

export {
    apiAuthSchema,
    apiConsultingSchema,
    customHeadersSchema,
    filterFilledCustomHeaders,
    isAuthFieldPath,
    isAuthValidationError,
    isCustomHeaderValidationError,
    mapAuthValidationErrors,
    mapCustomHeaderValidationErrors,
    toApiAuth,
    type ApiAuthForm,
    type ApiConsultingForm,
    type AuthFieldErrors,
    type AuthFieldPath,
    type CustomHeaderErrors,
    type CustomHeaderForm,
};
