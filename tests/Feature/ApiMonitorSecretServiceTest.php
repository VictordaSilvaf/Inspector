<?php

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\ApiMonitorSecretService;

test('secret service stores and resolves bearer token', function () {
    $monitor = ApiMonitor::factory()->for(User::factory())->create([
        'auth_type' => 'bearer',
        'auth_metadata' => ['configured' => true],
    ]);

    $service = app(ApiMonitorSecretService::class);

    $service->store($monitor, ['token' => 'my-token']);

    expect($service->hasConfiguredSecret($monitor))->toBeTrue();
    expect($service->resolve($monitor))->toBe(['token' => 'my-token']);
});

test('secret service partial update keeps existing secret when payload empty', function () {
    $monitor = ApiMonitor::factory()->for(User::factory())->withBearerAuth('keep-me')->create();

    $service = app(ApiMonitorSecretService::class);

    $service->store($monitor, []);

    expect($service->resolve($monitor))->toBe(['token' => 'keep-me']);
});

test('secret service delete removes configured secret', function () {
    $monitor = ApiMonitor::factory()->for(User::factory())->withBearerAuth()->create();

    $service = app(ApiMonitorSecretService::class);

    $service->delete($monitor);

    expect($service->hasConfiguredSecret($monitor))->toBeFalse();
    expect($service->resolve($monitor))->toBe([]);
});

test('secret service frontend auth config never exposes secrets', function () {
    $monitor = ApiMonitor::factory()->for(User::factory())->withBearerAuth('hidden-token')->create();

    $frontend = app(ApiMonitorSecretService::class)->toFrontendAuthConfig($monitor);

    expect($frontend)->toBe(['configured' => true]);
    expect($frontend)->not->toHaveKey('token');
});
