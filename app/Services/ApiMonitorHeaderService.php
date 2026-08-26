<?php

namespace App\Services;

use App\Models\ApiMonitor;
use App\Models\ApiMonitorHeader;
use App\Services\Security\SecretManager;

final class ApiMonitorHeaderService
{
    private const array SENSITIVE_HEADER_NAMES = [
        'authorization',
        'x-api-key',
        'api-key',
        'x-auth-token',
    ];

    public function __construct(
        private readonly SecretManager $secrets,
    ) {}

    /**
     * @param  array<int, array{key: string, value?: string|null}>|null  $headers
     */
    public function sync(ApiMonitor $monitor, ?array $headers): void
    {
        if ($headers === null) {
            $monitor->headers()->delete();

            return;
        }

        $existingHeaders = $monitor->headers()->get()->keyBy(
            fn (ApiMonitorHeader $header): string => strtolower($header->name),
        );

        $retainedIds = [];

        foreach ($headers as $header) {
            $name = trim((string) ($header['key'] ?? ''));

            if ($name === '') {
                continue;
            }

            $providedValue = array_key_exists('value', $header)
                ? $header['value']
                : null;
            $normalizedName = strtolower($name);
            $existing = $existingHeaders->get($normalizedName);
            $isSensitive = $this->isSensitiveHeader($name, is_string($providedValue) ? $providedValue : null);

            if ($existing !== null && ($providedValue === null || $providedValue === '')) {
                $retainedIds[] = $existing->id;

                continue;
            }

            if (! is_string($providedValue) || $providedValue === '') {
                continue;
            }

            $attributes = [
                'name' => $name,
                'is_sensitive' => $isSensitive,
                'value_plain' => null,
                'value_encrypted' => null,
            ];

            if ($isSensitive) {
                $attributes['value_encrypted'] = $this->secrets->encrypt(['value' => $providedValue]);
            } else {
                $attributes['value_plain'] = $providedValue;
            }

            $savedHeader = $monitor->headers()->updateOrCreate(
                ['name' => $name],
                $attributes,
            );

            $retainedIds[] = $savedHeader->id;
        }

        if ($retainedIds === []) {
            $monitor->headers()->delete();

            return;
        }

        $monitor->headers()->whereNotIn('id', $retainedIds)->delete();
    }

    /**
     * @return array<string, string>
     */
    public function resolveForRequest(ApiMonitor $monitor): array
    {
        $headers = [];

        foreach ($monitor->headers as $header) {
            if ($header->is_sensitive) {
                if ($header->value_encrypted === null) {
                    continue;
                }

                $payload = $this->secrets->decrypt($header->value_encrypted);
                $headers[$header->name] = (string) ($payload['value'] ?? '');

                continue;
            }

            if ($header->value_plain !== null) {
                $headers[$header->name] = $header->value_plain;
            }
        }

        return $headers;
    }

    /**
     * @return list<array{name: string, configured: bool, isSensitive: bool, value?: string}>
     */
    public function toFrontendArray(ApiMonitor $monitor): array
    {
        return $monitor->headers
            ->sortBy('name')
            ->values()
            ->map(function (ApiMonitorHeader $header): array {
                $item = [
                    'name' => $header->name,
                    'configured' => $header->is_sensitive
                        ? $header->value_encrypted !== null
                        : $header->value_plain !== null,
                    'isSensitive' => $header->is_sensitive,
                ];

                if (! $header->is_sensitive && $header->value_plain !== null) {
                    $item['value'] = $header->value_plain;
                }

                return $item;
            })
            ->all();
    }

    private function isSensitiveHeader(string $name, ?string $value): bool
    {
        $normalizedName = strtolower(trim($name));

        if (in_array($normalizedName, self::SENSITIVE_HEADER_NAMES, true)) {
            return true;
        }

        if ($value === null || $value === '') {
            return true;
        }

        if (str_starts_with(strtolower($value), 'bearer ')) {
            return true;
        }

        return strlen($value) >= 24;
    }
}
