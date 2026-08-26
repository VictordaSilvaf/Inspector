<?php

namespace App\Http\Requests\ApiInspector;

use App\Models\MonitorAlert;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncMonitorAlertSubscriptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $alert = $this->route('monitor_alert');

        return $alert instanceof MonitorAlert
            && $this->user()?->can('update', $alert) === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'notification_channel_ids' => ['required', 'array', 'min:1'],
            'notification_channel_ids.*' => [
                'integer',
                Rule::exists('notification_channels', 'id')
                    ->where('user_id', $this->user()?->id)
                    ->where('verification_status', 'verified')
                    ->where('is_active', true),
            ],
        ];
    }
}
