<?php

namespace App\Console\Commands;

use App\Models\ApiMonitor;
use App\Services\ApiMonitorHeaderService;
use App\Services\ApiMonitorSecretService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Throwable;

#[Signature('monitors:migrate-secrets')]
#[Description('Migrate legacy api monitor auth_config and custom_headers into dedicated secret tables.')]
class MigrateMonitorSecretsCommand extends Command
{
    public function handle(
        ApiMonitorSecretService $secretService,
        ApiMonitorHeaderService $headerService,
    ): int {
        if (! Schema::hasColumn('api_monitors', 'auth_config')) {
            $this->components->info('Legacy columns already removed. Nothing to migrate.');

            return self::SUCCESS;
        }

        $migratedAuth = 0;
        $migratedHeaders = 0;
        $failures = 0;

        ApiMonitor::query()
            ->orderBy('id')
            ->chunkById(50, function ($monitors) use (
                $secretService,
                $headerService,
                &$migratedAuth,
                &$migratedHeaders,
                &$failures,
            ): void {
                foreach ($monitors as $monitor) {
                    try {
                        if ($this->migrateAuthConfig($monitor, $secretService)) {
                            $migratedAuth++;
                        }

                        if ($this->migrateCustomHeaders($monitor, $headerService)) {
                            $migratedHeaders++;
                        }
                    } catch (Throwable $exception) {
                        $failures++;
                        $this->components->error("Monitor {$monitor->id}: {$exception->getMessage()}");
                    }
                }
            });

        $this->components->info("Migrated auth secrets for {$migratedAuth} monitor(s).");
        $this->components->info("Migrated custom headers for {$migratedHeaders} monitor(s).");

        if ($failures > 0) {
            $this->components->warn("Failed to migrate {$failures} monitor(s).");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function migrateAuthConfig(
        ApiMonitor $monitor,
        ApiMonitorSecretService $secretService,
    ): bool {
        $rawAuthConfig = $monitor->getRawOriginal('auth_config');

        if (! is_string($rawAuthConfig) || $rawAuthConfig === '') {
            return false;
        }

        if ($monitor->secret()->exists()) {
            return false;
        }

        /** @var array<string, mixed> $authConfig */
        $authConfig = json_decode(
            decrypt($rawAuthConfig),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );

        $authType = $monitor->auth_type;

        if ($authType === 'none') {
            return false;
        }

        $payload = $secretService->extractSecretPayload($authType, $authConfig);
        $metadata = $secretService->buildMetadata($authType, $authConfig);

        if ($payload !== []) {
            $secretService->store($monitor, $payload);
        }

        if ($metadata !== null) {
            if ($authType === 'basic' && $payload !== []) {
                $metadata['hasPassword'] = true;
            }

            $monitor->update(['auth_metadata' => $metadata]);
        }

        return true;
    }

    private function migrateCustomHeaders(
        ApiMonitor $monitor,
        ApiMonitorHeaderService $headerService,
    ): bool {
        $rawHeaders = $monitor->getRawOriginal('custom_headers');

        if (! is_string($rawHeaders) || $rawHeaders === '' || $rawHeaders === 'null') {
            return false;
        }

        if ($monitor->headers()->exists()) {
            return false;
        }

        /** @var array<int, array{key?: string, value?: string}>|null $headers */
        $headers = json_decode($rawHeaders, true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($headers) || $headers === []) {
            return false;
        }

        $normalized = [];

        foreach ($headers as $header) {
            $key = trim((string) ($header['key'] ?? ''));

            if ($key === '') {
                continue;
            }

            $normalized[] = [
                'key' => $key,
                'value' => (string) ($header['value'] ?? ''),
            ];
        }

        if ($normalized === []) {
            return false;
        }

        $headerService->sync($monitor, $normalized);

        return true;
    }
}
