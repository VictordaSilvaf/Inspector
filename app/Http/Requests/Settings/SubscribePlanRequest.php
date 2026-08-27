<?php

namespace App\Http\Requests\Settings;

use App\Enums\SubscriptionPlan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubscribePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan' => ['required', Rule::enum(SubscriptionPlan::class)],
        ];
    }

    public function targetPlan(): SubscriptionPlan
    {
        return SubscriptionPlan::from((string) $this->validated('plan'));
    }
}
