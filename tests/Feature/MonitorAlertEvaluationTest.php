<?php

use App\Enums\MonitorAlertState;
use App\Enums\NotificationLogEvent;
use App\Jobs\SendMonitorAlertNotificationJob;
use App\Models\AlertSubscription;
use App\Models\ApiMonitor;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\ApiMonitorChecker;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

test('checker dispatches alert notification job when condition is met', function () {
    Queue::fake();
    Http::fake([
        'https://api.example.com/health' => Http::response('fail', 500),
    ]);

    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/health',
        'expected_status_code' => 200,
    ]);
    $channel = NotificationChannel::factory()->for($user)->verified()->create();
    $alert = MonitorAlert::factory()->for($monitor)->statusCode(200)->create([
        'cooldown_seconds' => 300,
    ]);
    AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channel->id,
    ]);

    app(ApiMonitorChecker::class)->check($monitor);

    expect($alert->fresh()->state)->toBe(MonitorAlertState::Firing);

    Queue::assertPushed(SendMonitorAlertNotificationJob::class, function (SendMonitorAlertNotificationJob $job) use ($alert): bool {
        return $job->monitorAlertId === $alert->id
            && $job->event === NotificationLogEvent::Triggered->value;
    });
});

test('cooldown prevents a second alert dispatch while still firing', function () {
    Queue::fake();
    Http::fake([
        'https://api.example.com/health' => Http::response('fail', 500),
    ]);

    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/health',
        'expected_status_code' => 200,
    ]);
    $channel = NotificationChannel::factory()->for($user)->verified()->create();
    $alert = MonitorAlert::factory()->for($monitor)->statusCode(200)->create([
        'cooldown_seconds' => 300,
    ]);
    AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channel->id,
    ]);

    $checker = app(ApiMonitorChecker::class);
    $checker->check($monitor->fresh());
    $checker->check($monitor->fresh());

    Queue::assertPushed(SendMonitorAlertNotificationJob::class, 1);
});

test('checker dispatches recovery notification when alert returns to ok', function () {
    Queue::fake();
    Http::fake([
        'https://api.example.com/health' => Http::response(['ok' => true], 200),
    ]);

    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/health',
        'expected_status_code' => 200,
    ]);
    $channel = NotificationChannel::factory()->for($user)->verified()->create();
    $alert = MonitorAlert::factory()->for($monitor)->statusCode(200)->firing()->create([
        'cooldown_seconds' => 300,
        'last_triggered_at' => now()->subMinutes(10),
    ]);
    AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channel->id,
    ]);

    app(ApiMonitorChecker::class)->check($monitor);

    expect($alert->fresh()->state)->toBe(MonitorAlertState::Ok)
        ->and($alert->fresh()->last_resolved_at)->not->toBeNull();

    Queue::assertPushed(SendMonitorAlertNotificationJob::class, function (SendMonitorAlertNotificationJob $job) use ($alert): bool {
        return $job->monitorAlertId === $alert->id
            && $job->event === NotificationLogEvent::Recovered->value;
    });
});
