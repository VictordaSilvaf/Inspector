<?php

use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Services\ApiMonitorHeaderService;
use Illuminate\Support\Facades\Http;

test('api monitors check command runs due monitors', function () {
    Http::fake([
        'https://api.example.com/health' => Http::response(['ok' => true], 200),
    ]);

    $monitor = ApiMonitor::factory()->dueForCheck()->create([
        'url' => 'https://api.example.com/health',
    ]);

    $this->artisan('api-monitors:check')
        ->expectsOutputToContain('Checked 1 API monitor(s).')
        ->assertSuccessful();

    $monitor->refresh();

    expect($monitor->last_status)->toBe('success');
    expect(ApiMonitorCheck::query()->where('api_monitor_id', $monitor->id)->count())->toBe(1);

    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.example.com/health'
            && $request->method() === 'GET';
    });
});

test('api monitors check command skips monitors that are not due yet', function () {
    Http::fake();

    ApiMonitor::factory()->notDueForCheck()->create([
        'url' => 'https://api.example.com/health',
    ]);

    $this->artisan('api-monitors:check')
        ->expectsOutputToContain('Checked 0 API monitor(s).')
        ->assertSuccessful();

    Http::assertNothingSent();
    expect(ApiMonitorCheck::query()->count())->toBe(0);
});

test('api monitors check command skips inactive monitors', function () {
    Http::fake();

    ApiMonitor::factory()->inactive()->dueForCheck()->create([
        'url' => 'https://api.example.com/health',
    ]);

    $this->artisan('api-monitors:check')
        ->expectsOutputToContain('Checked 0 API monitor(s).')
        ->assertSuccessful();

    Http::assertNothingSent();
});

test('api monitors check command uses stored auth and headers', function () {
    Http::fake([
        'https://api.example.com/secure' => Http::response([], 200),
    ]);

    $monitor = ApiMonitor::factory()
        ->withBearerAuth('secret-token')
        ->dueForCheck()
        ->create([
            'url' => 'https://api.example.com/secure',
        ]);

    app(ApiMonitorHeaderService::class)->sync($monitor, [
        ['key' => 'X-Custom', 'value' => 'test-value'],
    ]);

    $this->artisan('api-monitors:check')->assertSuccessful();

    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.example.com/secure'
            && $request->hasHeader('Authorization', 'Bearer secret-token')
            && $request->hasHeader('X-Custom', 'test-value');
    });

    expect(
        ApiMonitorCheck::query()->first()?->triggered_by
    )->toBe('scheduled');
});

test('api monitors check command skips unsafe monitor urls', function () {
    Http::fake();

    ApiMonitor::factory()->dueForCheck()->create([
        'url' => 'http://127.0.0.1/health',
    ]);

    $this->artisan('api-monitors:check')
        ->expectsOutputToContain('Checked 1 API monitor(s).')
        ->assertSuccessful();

    Http::assertNothingSent();
    expect(ApiMonitorCheck::query()->count())->toBe(1);
    expect(ApiMonitorCheck::query()->first()?->error_message)
        ->toBe('O endereço configurado não pode ser monitorado.');
});

test('api monitor is due when last check is older than interval', function () {
    $monitor = ApiMonitor::factory()->make([
        'interval_seconds' => 30,
        'last_checked_at' => now()->subSeconds(31),
    ]);

    expect($monitor->isDueForCheck())->toBeTrue();
});

test('api monitor is not due when interval has not elapsed', function () {
    $monitor = ApiMonitor::factory()->make([
        'interval_seconds' => 30,
        'last_checked_at' => now()->subSeconds(5),
    ]);

    expect($monitor->isDueForCheck())->toBeFalse();
});
