<?php

use App\Models\ApiMonitor;
use App\Models\ApiMonitorSecretAudit;
use App\Models\User;
use App\Services\ApiMonitorChecker;
use App\Services\Security\MonitorSecretAuditService;
use Illuminate\Support\Facades\Http;

test('creating monitor with bearer auth records secret created audit', function () {
    Http::fake([
        'https://api.example.com/secure' => Http::response([], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('api-inspector.store'), [
        'name' => 'Secure API',
        'url' => 'https://api.example.com/secure',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'bearer',
        'auth_config' => [
            'token' => 'super-secret-token',
        ],
    ])->assertSessionHasNoErrors();

    $monitor = ApiMonitor::query()->first();

    expect($monitor)->not->toBeNull();

    $audit = ApiMonitorSecretAudit::query()->first();

    expect($audit)->not->toBeNull();
    expect($audit->user_id)->toBe($user->id);
    expect($audit->api_monitor_id)->toBe($monitor->id);
    expect($audit->action)->toBe(MonitorSecretAuditService::ACTION_SECRET_CREATED);
    expect($audit->metadata)->toBe(['auth_type' => 'bearer']);
    expect(json_encode($audit->metadata))->not->toContain('super-secret-token');
});

test('rotating monitor secret records secret rotated audit', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->withBearerAuth('old-token')->create([
        'url' => 'https://api.example.com/secure',
    ]);

    $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => $monitor->name,
        'url' => $monitor->url,
        'http_method' => $monitor->http_method,
        'interval_seconds' => $monitor->interval_seconds,
        'auth_type' => 'bearer',
        'auth_config' => [
            'token' => 'new-token',
        ],
    ])->assertSessionHasNoErrors();

    expect(
        ApiMonitorSecretAudit::query()
            ->where('action', MonitorSecretAuditService::ACTION_SECRET_ROTATED)
            ->exists(),
    )->toBeTrue();
});

test('removing authentication records secret deleted and auth type changed audits', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->withBearerAuth()->create([
        'url' => 'https://api.example.com/secure',
    ]);

    $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => $monitor->name,
        'url' => $monitor->url,
        'http_method' => $monitor->http_method,
        'interval_seconds' => $monitor->interval_seconds,
        'auth_type' => 'none',
    ])->assertSessionHasNoErrors();

    expect(
        ApiMonitorSecretAudit::query()
            ->where('action', MonitorSecretAuditService::ACTION_AUTH_TYPE_CHANGED)
            ->exists(),
    )->toBeTrue();

    expect(
        ApiMonitorSecretAudit::query()
            ->where('action', MonitorSecretAuditService::ACTION_SECRET_DELETED)
            ->exists(),
    )->toBeTrue();
});

test('checker records url blocked audit for unsafe monitor urls', function () {
    Http::fake();

    $monitor = ApiMonitor::factory()->create([
        'url' => 'http://127.0.0.1/health',
    ]);

    app(ApiMonitorChecker::class)->check($monitor, 'scheduled');

    Http::assertNothingSent();

    expect(
        ApiMonitorSecretAudit::query()
            ->where('action', MonitorSecretAuditService::ACTION_URL_BLOCKED)
            ->exists(),
    )->toBeTrue();
});
