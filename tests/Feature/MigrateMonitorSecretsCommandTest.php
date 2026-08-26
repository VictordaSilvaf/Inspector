<?php

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\ApiMonitorHeaderService;
use App\Services\ApiMonitorSecretService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

test('migrate monitor secrets command reports when legacy columns are gone', function () {
    expect(Schema::hasColumn('api_monitors', 'auth_config'))->toBeFalse();

    $this->artisan('monitors:migrate-secrets')
        ->expectsOutputToContain('Legacy columns already removed.')
        ->assertSuccessful();
});

test('migrate monitor secrets command migrates legacy auth config and headers', function () {
    Artisan::call('migrate:rollback', [
        '--step' => 1,
        '--force' => true,
    ]);

    expect(Schema::hasColumn('api_monitors', 'auth_config'))->toBeTrue();

    $monitor = ApiMonitor::factory()->for(User::factory())->create([
        'auth_type' => 'bearer',
        'auth_metadata' => null,
    ]);

    $monitor->headers()->delete();

    $legacyAuthConfig = encrypt(json_encode(['token' => 'legacy-token'], JSON_THROW_ON_ERROR));

    $monitor->forceFill([
        'auth_config' => $legacyAuthConfig,
        'custom_headers' => json_encode([
            ['key' => 'X-Custom', 'value' => 'legacy-header'],
        ], JSON_THROW_ON_ERROR),
    ])->saveQuietly();

    $this->artisan('monitors:migrate-secrets')->assertSuccessful();

    $monitor->refresh();

    expect(app(ApiMonitorSecretService::class)->resolve($monitor))
        ->toBe(['token' => 'legacy-token']);
    expect($monitor->auth_metadata)->toBe(['configured' => true]);

    $headers = app(ApiMonitorHeaderService::class)->resolveForRequest($monitor);
    expect($headers)->toHaveKey('X-Custom');
    expect($headers['X-Custom'])->toBe('legacy-header');

    Artisan::call('migrate', ['--force' => true]);
});
