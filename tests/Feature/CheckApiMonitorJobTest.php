<?php

use App\Jobs\CheckApiMonitor;
use App\Models\ApiMonitor;
use App\Services\ApiMonitorChecker;
use Illuminate\Support\Facades\Http;

test('check api monitor job serializes only monitor id and triggered by', function () {
    $job = new CheckApiMonitor(42, 'scheduled');

    $serialized = serialize($job);
    $unserialized = unserialize($serialized);

    expect($unserialized)->toBeInstanceOf(CheckApiMonitor::class);
    expect($unserialized->monitorId)->toBe(42);
    expect($unserialized->triggeredBy)->toBe('scheduled');
    expect($serialized)->not->toContain('secret-token');
});

test('check api monitor job runs checker for active monitor', function () {
    Http::fake([
        'https://api.example.com/health' => Http::response(['ok' => true], 200),
    ]);

    $monitor = ApiMonitor::factory()->unchecked()->create([
        'url' => 'https://api.example.com/health',
    ]);

    $checker = Mockery::mock(ApiMonitorChecker::class);
    $checker->shouldReceive('check')
        ->once()
        ->withArgs(function (ApiMonitor $passedMonitor, string $triggeredBy) use ($monitor): bool {
            return $passedMonitor->is($monitor) && $triggeredBy === 'scheduled';
        });

    (new CheckApiMonitor($monitor->id, 'scheduled'))->handle($checker);
});

test('check api monitor job skips missing or inactive monitors', function () {
    $checker = Mockery::mock(ApiMonitorChecker::class);
    $checker->shouldReceive('check')->never();

    (new CheckApiMonitor(999_999, 'scheduled'))->handle($checker);

    $inactive = ApiMonitor::factory()->inactive()->create();
    (new CheckApiMonitor($inactive->id, 'scheduled'))->handle($checker);
});
