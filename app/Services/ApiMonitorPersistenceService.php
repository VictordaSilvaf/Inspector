<?php

namespace App\Services;

use App\Http\Requests\ApiInspector\StoreApiMonitorRequest;
use App\Http\Requests\ApiInspector\UpdateApiMonitorRequest;
use App\Models\ApiMonitor;
use App\Services\Security\MonitorSecretAuditService;
use Illuminate\Support\Facades\DB;

final class ApiMonitorPersistenceService
{
    public function __construct(
        private readonly ApiMonitorSecretService $secretService,
        private readonly ApiMonitorHeaderService $headerService,
        private readonly MonitorSecretAuditService $auditService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function createFromStoreRequest(StoreApiMonitorRequest $request): array
    {
        $validated = $request->validated();
        $authType = (string) ($validated['auth_type'] ?? 'none');
        $authConfig = is_array($validated['auth_config'] ?? null) ? $validated['auth_config'] : [];
        $actor = $request->user();

        return DB::transaction(function () use ($validated, $authType, $authConfig, $request, $actor): array {
            $monitor = $request->user()->apiMonitors()->create([
                'name' => $validated['name'],
                'url' => $validated['url'],
                'http_method' => $validated['http_method'],
                'interval_seconds' => $validated['interval_seconds'],
                'auth_type' => $authType,
                'auth_metadata' => $this->secretService->buildMetadata($authType, $authConfig),
            ]);

            if ($authType !== 'none') {
                $this->secretService->store(
                    $monitor,
                    $this->secretService->extractSecretPayload($authType, $authConfig),
                    $actor,
                );
            }

            $this->headerService->sync(
                $monitor,
                $this->normalizeHeaders($validated['custom_headers'] ?? null),
            );

            return [
                'monitor' => $monitor->fresh(['secret', 'headers']),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function updateFromRequest(UpdateApiMonitorRequest $request, ApiMonitor $monitor): array
    {
        $validated = $request->validated();
        $authType = (string) ($validated['auth_type'] ?? 'none');
        $authConfig = is_array($validated['auth_config'] ?? null) ? $validated['auth_config'] : [];
        $actor = $request->user();
        $previousAuthType = $monitor->auth_type;

        return DB::transaction(function () use ($validated, $authType, $authConfig, $monitor, $actor, $previousAuthType): array {
            $metadata = $this->secretService->buildMetadata($authType, $authConfig);

            if ($authType === 'basic' && is_array($metadata)) {
                $existingMetadata = is_array($monitor->auth_metadata) ? $monitor->auth_metadata : [];
                $metadata['hasPassword'] = ($authConfig['password'] ?? '') !== ''
                    || (bool) ($existingMetadata['hasPassword'] ?? $this->secretService->hasConfiguredSecret($monitor));
            }

            $monitor->update([
                'name' => $validated['name'],
                'url' => $validated['url'],
                'http_method' => $validated['http_method'],
                'interval_seconds' => $validated['interval_seconds'],
                'auth_type' => $authType,
                'auth_metadata' => $metadata,
                'is_active' => $validated['is_active'] ?? $monitor->is_active,
            ]);

            if ($authType !== $previousAuthType) {
                $this->auditService->record(
                    $monitor,
                    MonitorSecretAuditService::ACTION_AUTH_TYPE_CHANGED,
                    $actor,
                    [
                        'from' => $previousAuthType,
                        'to' => $authType,
                    ],
                );
            }

            if ($authType === 'none') {
                $this->secretService->delete($monitor, $actor);
            } else {
                $secretPayload = $this->secretService->extractSecretPayload($authType, $authConfig);
                $providedSecret = $this->firstNonEmptySecretValue($secretPayload);

                if ($providedSecret !== null) {
                    $this->secretService->store($monitor, $secretPayload, $actor);
                }
            }

            $this->headerService->sync(
                $monitor,
                $this->normalizeHeaders($validated['custom_headers'] ?? null),
            );

            return [
                'monitor' => $monitor->fresh(['secret', 'headers']),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(ApiMonitor $monitor): array
    {
        return [
            'id' => $monitor->id,
            'name' => $monitor->name,
            'url' => $monitor->url,
            'httpMethod' => $monitor->http_method,
            'intervalSeconds' => $monitor->interval_seconds,
            'expectedStatusCode' => $monitor->expected_status_code,
            'customHeaders' => $this->headerService->toFrontendArray($monitor),
            'customHeaderCount' => $monitor->headers->count(),
            'lastStatus' => $monitor->last_status,
            'lastResponseTimeMs' => $monitor->last_response_time_ms,
            'hasAuthentication' => $monitor->auth_type !== 'none',
            'lastCheckedAt' => $monitor->last_checked_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toEditableArray(ApiMonitor $monitor): array
    {
        return [
            ...$this->toFrontendArray($monitor),
            'authType' => $monitor->auth_type,
            'authConfig' => $this->secretService->toFrontendAuthConfig($monitor),
            'isActive' => $monitor->is_active,
            'consecutiveFailures' => $monitor->consecutive_failures,
        ];
    }

    /**
     * @param  array<int, array{key: string, value?: string|null}>|null  $headers
     * @return array<int, array{key: string, value?: string|null}>|null
     */
    private function normalizeHeaders(?array $headers): ?array
    {
        if ($headers === null) {
            return null;
        }

        $normalized = [];

        foreach ($headers as $header) {
            $key = trim((string) ($header['key'] ?? ''));

            if ($key === '') {
                continue;
            }

            $item = ['key' => $key];

            if (array_key_exists('value', $header)) {
                $item['value'] = $header['value'];
            }

            $normalized[] = $item;
        }

        return $normalized === [] ? null : $normalized;
    }

    /**
     * @param  array<string, mixed>  $secretPayload
     */
    private function firstNonEmptySecretValue(array $secretPayload): ?string
    {
        foreach ($secretPayload as $value) {
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }
}
