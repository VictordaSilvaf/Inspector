<?php

use App\Enums\MonitorAlertOperator;
use App\Enums\MonitorAlertType;
use App\Models\AlertSubscription;
use App\Models\ApiMonitor;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use App\Models\User;

test('users can visit the alerts page for their monitor', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'name' => 'Payments API',
    ]);
    MonitorAlert::factory()->for($monitor)->availability()->create([
        'name' => 'Down',
    ]);

    $response = $this->actingAs($user)->get(route('api-inspector.alerts.index', $monitor));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/alerts')
            ->where('monitor.id', $monitor->id)
            ->where('monitor.name', 'Payments API')
            ->has('alerts', 1)
            ->where('alerts.0.name', 'Down')
        );
});

test('users cannot visit alerts for another users monitor', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->get(route('api-inspector.alerts.index', $monitor))
        ->assertForbidden();
});

test('users can create an alert on their own monitor', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();
    $channel = NotificationChannel::factory()->for($user)->verified()->create();

    $response = $this->actingAs($user)->post(route('api-inspector.alerts.store', $monitor), [
        'name' => 'Indisponível',
        'type' => MonitorAlertType::Availability->value,
        'operator' => MonitorAlertOperator::Equals->value,
        'value' => 'false',
        'cooldown_seconds' => 300,
        'notification_channel_ids' => [$channel->id],
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('api-inspector.alerts.index', $monitor));

    $alert = MonitorAlert::query()->first();

    expect($alert)->not->toBeNull()
        ->and($alert->api_monitor_id)->toBe($monitor->id)
        ->and($alert->type)->toBe(MonitorAlertType::Availability)
        ->and($alert->subscriptions)->toHaveCount(1)
        ->and($alert->subscriptions->first()->notification_channel_id)->toBe($channel->id);
});

test('users cannot create an alert on another users monitor', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->post(route('api-inspector.alerts.store', $monitor), [
            'type' => MonitorAlertType::Availability->value,
            'operator' => MonitorAlertOperator::Equals->value,
            'value' => 'false',
        ])
        ->assertForbidden();

    expect(MonitorAlert::query()->count())->toBe(0);
});

test('subscriptions only accept verified notification channels', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();
    $alert = MonitorAlert::factory()->for($monitor)->availability()->create();
    $pendingChannel = NotificationChannel::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->from(route('api-inspector.alerts.index', $monitor))
        ->put(route('api-inspector.alerts.subscriptions.sync', [$monitor, $alert]), [
            'notification_channel_ids' => [$pendingChannel->id],
        ]);

    $response->assertSessionHasErrors('notification_channel_ids.0');

    expect(AlertSubscription::query()->count())->toBe(0);
});

test('users can sync subscriptions with verified channels', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();
    $alert = MonitorAlert::factory()->for($monitor)->availability()->create();
    $channel = NotificationChannel::factory()->for($user)->verified()->create();

    $response = $this->actingAs($user)->put(
        route('api-inspector.alerts.subscriptions.sync', [$monitor, $alert]),
        ['notification_channel_ids' => [$channel->id]],
    );

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('api-inspector.alerts.index', $monitor));

    expect($alert->subscriptions()->where('is_active', true)->count())->toBe(1);
});
