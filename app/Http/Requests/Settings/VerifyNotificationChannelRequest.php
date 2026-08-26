<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerifyNotificationChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        $channel = $this->route('notification_channel');

        return $channel !== null
            && $this->user()?->can('update', $channel) === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Informe o código de verificação.',
            'code.size' => 'O código deve ter 6 dígitos.',
            'code.regex' => 'O código deve conter apenas números.',
        ];
    }
}
