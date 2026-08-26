<?php

namespace App\Http\Requests\Settings;

use App\Enums\NotificationChannelType;
use App\Models\NotificationChannel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', NotificationChannel::class) === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(NotificationChannelType::class), Rule::in([NotificationChannelType::Email->value])],
            'value' => [
                'required',
                'email',
                'max:255',
                Rule::unique('notification_channels', 'value')->where(fn ($query) => $query
                    ->where('user_id', $this->user()?->id)
                    ->where('type', $this->input('type', NotificationChannelType::Email->value))),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'value.unique' => 'Este email já está cadastrado como canal.',
            'type.in' => 'No momento apenas canais de email são suportados.',
        ];
    }
}
