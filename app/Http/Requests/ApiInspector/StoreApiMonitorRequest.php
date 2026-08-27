<?php

namespace App\Http\Requests\ApiInspector;

use App\Rules\SafeMonitorUrl;
use App\Services\Billing\PlanLimitsService;
use App\Services\Security\MonitorSecretChangeDetector;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreApiMonitorRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $requiresSecretProtection = app(MonitorSecretChangeDetector::class)
            ->storeRequiresSecretProtection($this);
        $allowedIntervals = app(PlanLimitsService::class)
            ->forUser($this->user())
            ->allowedIntervals;

        return [
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'string', 'url', 'max:2048', 'regex:/^https?:\/\//i', new SafeMonitorUrl],
            'http_method' => ['required', Rule::in(['GET', 'POST', 'PUT', 'DELETE'])],
            'interval_seconds' => ['required', 'integer', Rule::in($allowedIntervals)],
            'auth_type' => ['required', Rule::in(['none', 'basic', 'bearer', 'api_key'])],
            'auth_config' => ['nullable', 'array'],
            'auth_config.username' => ['required_if:auth_type,basic', 'nullable', 'string', 'max:255'],
            'auth_config.password' => ['required_if:auth_type,basic', 'nullable', 'string', 'max:255'],
            'auth_config.token' => ['required_if:auth_type,bearer', 'nullable', 'string', 'max:4096'],
            'auth_config.api_key' => ['required_if:auth_type,api_key', 'nullable', 'string', 'max:4096'],
            'auth_config.header_name' => ['required_if:auth_type,api_key', 'nullable', 'string', 'max:255'],
            'current_password' => [
                Rule::requiredIf($requiresSecretProtection),
                'nullable',
                'string',
                'current_password',
            ],
            'custom_headers' => ['nullable', 'array'],
            'custom_headers.*.key' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9!#$%&\'*+.^_`|~-]+$/'],
            'custom_headers.*.value' => ['required', 'string', 'max:4096'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();

            if ($user === null) {
                return;
            }

            $limits = app(PlanLimitsService::class)->forUser($user);

            if ($user->apiMonitors()->count() >= $limits->maxMonitors) {
                $validator->errors()->add(
                    'name',
                    "Você atingiu o limite de {$limits->maxMonitors} monitores do plano {$limits->plan->label()}.",
                );
            }

            if (! app(MonitorSecretChangeDetector::class)->storeRequiresSecretProtection($this)) {
                return;
            }

            if ((bool) config('monitors.require_two_factor_for_secrets', false)
                && ! $user->hasEnabledTwoFactorAuthentication()) {
                $validator->errors()->add(
                    'auth_type',
                    'Ative a autenticação em dois fatores em Segurança antes de configurar credenciais.',
                );
            }
        });
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
            'interval_seconds.in' => 'Este intervalo não está disponível no seu plano.',
            'auth_config.username.required_if' => 'Informe o usuário da API.',
            'auth_config.password.required_if' => 'Informe a senha da API.',
            'auth_config.token.required_if' => 'Informe o token Bearer da API.',
            'auth_config.api_key.required_if' => 'Informe a API Key.',
            'auth_config.header_name.required_if' => 'Informe o nome do header da API Key.',
            'current_password.required' => 'Confirme sua senha para alterar credenciais.',
            'current_password.current_password' => 'A senha informada está incorreta.',
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
