<?php

namespace App\Http\Requests\ApiInspector;

use App\Enums\MonitorAlertOperator;
use App\Enums\MonitorAlertType;
use App\Models\ApiMonitor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMonitorAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        $monitor = $this->route('api_monitor');

        return $monitor instanceof ApiMonitor
            && $this->user()?->id === $monitor->user_id;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::enum(MonitorAlertType::class)],
            'operator' => ['required', Rule::enum(MonitorAlertOperator::class)],
            'value' => ['required', 'string', 'max:255'],
            'cooldown_seconds' => ['nullable', 'integer', 'min:60', 'max:86400'],
            'notification_channel_ids' => ['nullable', 'array'],
            'notification_channel_ids.*' => [
                'integer',
                Rule::exists('notification_channels', 'id')
                    ->where('user_id', $this->user()?->id)
                    ->where('verification_status', 'verified')
                    ->where('is_active', true),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $type = MonitorAlertType::tryFrom((string) $this->input('type'));
            $operator = MonitorAlertOperator::tryFrom((string) $this->input('operator'));
            $value = $this->input('value');

            if ($type === null || $operator === null) {
                return;
            }

            if ($type === MonitorAlertType::ResponseTime) {
                if ($operator !== MonitorAlertOperator::GreaterThan && $operator !== MonitorAlertOperator::LessThan) {
                    $validator->errors()->add('operator', 'Para tempo de resposta use maior ou menor que.');
                }

                if (! is_numeric($value) || (int) $value < 1) {
                    $validator->errors()->add('value', 'Informe um tempo em milissegundos válido.');
                }
            }

            if ($type === MonitorAlertType::StatusCode) {
                if ($operator !== MonitorAlertOperator::Equals && $operator !== MonitorAlertOperator::NotEquals) {
                    $validator->errors()->add('operator', 'Para status HTTP use igual ou diferente.');
                }

                if (! is_numeric($value) || (int) $value < 100 || (int) $value > 599) {
                    $validator->errors()->add('value', 'Informe um status HTTP válido.');
                }
            }

            if ($type === MonitorAlertType::Availability) {
                if ($operator !== MonitorAlertOperator::Equals) {
                    $validator->errors()->add('operator', 'Para disponibilidade use o operador igual.');
                }

                if (! in_array((string) $value, ['false', '0', 'unavailable'], true)) {
                    $validator->errors()->add('value', 'Use false para alertar quando a API estiver indisponível.');
                }
            }
        });
    }
}
