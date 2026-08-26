<?php

namespace App\Http\Requests\ApiInspector;

use App\Models\ApiMonitor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApiMonitorRequest extends FormRequest
{
    public function authorize(): bool
    {
        $monitor = $this->route('api_monitor');

        return $monitor instanceof ApiMonitor
            && $this->user()?->can('update', $monitor) === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'string', 'url', 'max:2048', 'regex:/^https?:\/\//i'],
            'http_method' => ['required', Rule::in(['GET', 'POST', 'PUT', 'DELETE'])],
            'interval_seconds' => ['required', 'integer', Rule::in([10, 30, 60])],
            'auth_type' => ['required', Rule::in(['none', 'basic', 'bearer', 'api_key'])],
            'auth_config' => ['nullable', 'array'],
            'auth_config.username' => ['required_if:auth_type,basic', 'nullable', 'string', 'max:255'],
            'auth_config.password' => ['required_if:auth_type,basic', 'nullable', 'string', 'max:255'],
            'auth_config.token' => ['required_if:auth_type,bearer', 'nullable', 'string', 'max:4096'],
            'auth_config.api_key' => ['required_if:auth_type,api_key', 'nullable', 'string', 'max:4096'],
            'auth_config.header_name' => ['required_if:auth_type,api_key', 'nullable', 'string', 'max:255'],
            'custom_headers' => ['nullable', 'array'],
            'custom_headers.*.key' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9!#$%&\'*+.^_`|~-]+$/'],
            'custom_headers.*.value' => ['required', 'string', 'max:4096'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Informe o nome do monitor.',
            'url.required' => 'Informe o endereço da API.',
            'url.url' => 'Informe uma URL válida (ex.: https://api.exemplo.com).',
            'url.regex' => 'A URL deve começar com http:// ou https://.',
            'http_method.required' => 'Selecione o método HTTP.',
            'interval_seconds.required' => 'Selecione o intervalo de verificação.',
            'interval_seconds.in' => 'Selecione um intervalo de verificação válido.',
            'auth_config.username.required_if' => 'Informe o usuário da API.',
            'auth_config.password.required_if' => 'Informe a senha da API.',
            'auth_config.token.required_if' => 'Informe o token Bearer da API.',
            'auth_config.api_key.required_if' => 'Informe a API Key.',
            'auth_config.header_name.required_if' => 'Informe o nome do header da API Key.',
            'custom_headers.*.key.required' => 'Informe o nome do header.',
            'custom_headers.*.value.required' => 'Informe o valor do header.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        if (($validated['auth_type'] ?? 'none') === 'none') {
            $validated['auth_config'] = null;
        }

        if (empty($validated['custom_headers'])) {
            $validated['custom_headers'] = null;
        }

        return $validated;
    }
}
