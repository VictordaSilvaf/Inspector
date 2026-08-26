<?php

namespace App\Services;

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\Security\MonitorCredentialNotificationService;
use App\Services\Security\MonitorSecretAuditService;
use App\Services\Security\SecretManager;

final class ApiMonitorSecretService
{
    public function __construct(
        private readonly SecretManager $secrets,
        private readonly MonitorSecretAuditService $auditService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function store(ApiMonitor $monitor, array $payload, ?User $actor = null): void
    {
        if ($payload === []) {
            return;
        }

        $isRotation = $this->hasConfiguredSecret($monitor);
        $action = $isRotation
            ? MonitorSecretAuditService::ACTION_SECRET_ROTATED
            : MonitorSecretAuditService::ACTION_SECRET_CREATED;

        $monitor->secret()->updateOrCreate(
            ['api_monitor_id' => $monitor->id],
            [
                'encrypted_payload' => $this->secrets->encrypt($payload),
                'key_version' => 1,
                'last_rotated_at' => now(),
            ],
        );

        $this->auditService->record(
            $monitor,
            $action,
            $actor,
            ['auth_type' => $monitor->auth_type],
        );

        app(MonitorCredentialNotificationService::class)->notifyChanged(
            $monitor,
            $action,
            $actor,
        );
    }

    public function delete(ApiMonitor $monitor, ?User $actor = null): void
    {
        if (! $this->hasConfiguredSecret($monitor)) {
            return;
        }

        $monitor->secret()?->delete();

        $this->auditService->record(
            $monitor,
            MonitorSecretAuditService::ACTION_SECRET_DELETED,
            $actor,
            ['auth_type' => $monitor->auth_type],
        );

        app(MonitorCredentialNotificationService::class)->notifyChanged(
            $monitor,
            MonitorSecretAuditService::ACTION_SECRET_DELETED,
            $actor,
        );
    }

    public function hasConfiguredSecret(ApiMonitor $monitor): bool
    {
        return $monitor->secret()->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function resolve(ApiMonitor $monitor): array
    {
        $secret = $monitor->secret;

        if ($secret === null) {
            return [];
        }

        return $this->secrets->decrypt($secret->encrypted_payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function buildMetadata(string $authType, array $authConfig): ?array
    {
        return match ($authType) {
            'none' => null,
            'bearer' => ['configured' => true],
            'basic' => [
                'username' => (string) ($authConfig['username'] ?? ''),
                'hasPassword' => true,
            ],
            'api_key' => [
                'headerName' => (string) ($authConfig['header_name'] ?? 'X-API-Key'),
                'configured' => true,
            ],
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $authConfig
     * @return array<string, mixed>
     */
    public function extractSecretPayload(string $authType, array $authConfig): array
    {
        return match ($authType) {
            'bearer' => ['token' => (string) ($authConfig['token'] ?? '')],
            'basic' => ['password' => (string) ($authConfig['password'] ?? '')],
            'api_key' => ['api_key' => (string) ($authConfig['api_key'] ?? '')],
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendAuthConfig(ApiMonitor $monitor): array
    {
        $metadata = is_array($monitor->auth_metadata) ? $monitor->auth_metadata : [];

        return match ($monitor->auth_type) {
            'basic' => [
                'username' => (string) ($metadata['username'] ?? ''),
                'hasPassword' => (bool) ($metadata['hasPassword'] ?? $this->hasConfiguredSecret($monitor)),
                'configured' => $this->hasConfiguredSecret($monitor),
            ],
            'bearer' => [
                'configured' => (bool) ($metadata['configured'] ?? $this->hasConfiguredSecret($monitor)),
            ],
            'api_key' => [
                'headerName' => (string) ($metadata['headerName'] ?? 'X-API-Key'),
                'configured' => (bool) ($metadata['configured'] ?? $this->hasConfiguredSecret($monitor)),
            ],
            default => [],
        };
    }
}
