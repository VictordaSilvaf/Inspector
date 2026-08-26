<?php

namespace App\Services\Security;

use App\Models\ApiMonitor;
use App\Services\ApiMonitorSecretService;
use Illuminate\Foundation\Http\FormRequest;

final class MonitorSecretChangeDetector
{
    public function __construct(
        private readonly ApiMonitorSecretService $secretService,
    ) {}

    public function storeRequiresSecretProtection(FormRequest $request): bool
    {
        return (string) $request->input('auth_type', 'none') !== 'none';
    }

    public function updateRequiresSecretProtection(FormRequest $request, ApiMonitor $monitor): bool
    {
        $authType = (string) $request->input('auth_type', 'none');
        $authConfig = $request->input('auth_config', []);
        $authConfig = is_array($authConfig) ? $authConfig : [];

        if ($authType !== $monitor->auth_type) {
            return $monitor->auth_type !== 'none' || $authType !== 'none';
        }

        if ($authType === 'none') {
            return false;
        }

        $secretField = match ($authType) {
            'bearer' => 'token',
            'basic' => 'password',
            'api_key' => 'api_key',
            default => null,
        };

        if ($secretField === null) {
            return false;
        }

        return trim((string) ($authConfig[$secretField] ?? '')) !== '';
    }
}
