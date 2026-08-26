<?php

use App\Models\AlertSubscription;
use App\Models\ApiMonitor;
use App\Models\MonitorAlert;
use App\Models\NotificationChannel;
use App\Models\User;

test('unsubscribe page is available for a valid token', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create(['name' => 'Payments']);
    $alert = MonitorAlert::factory()->for($monitor)->availability()->create(['name' => 'Down']);
    $channel = NotificationChannel::factory()->for($user)->verified()->create([
        'value' => 'ops@example.com',
    ]);
    $subscription = AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channel->id,
    ]);

    $response = $this->get(route('unsubscribe.show', $subscription->unsubscribe_token));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('unsubscribe')
            ->where('alreadyUnsubscribed', false)
            ->where('monitorName', 'Payments')
            ->where('alertName', 'Down')
            ->where('channelValue', 'ops@example.com')
        );
});

test('unsubscribe by token deactivates only that subscription', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();
    $alert = MonitorAlert::factory()->for($monitor)->availability()->create();
    $channelA = NotificationChannel::factory()->for($user)->verified()->create();
    $channelB = NotificationChannel::factory()->for($user)->verified()->create();

    $subscriptionA = AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channelA->id,
    ]);
    $subscriptionB = AlertSubscription::factory()->for($alert)->create([
        'notification_channel_id' => $channelB->id,
    ]);

    $response = $this->post(route('unsubscribe.store', $subscriptionA->unsubscribe_token));

    $response->assertRedirect(route('unsubscribe.show', $subscriptionA->unsubscribe_token));

    expect($subscriptionA->fresh()->is_active)->toBeFalse()
        ->and($subscriptionA->fresh()->unsubscribed_at)->not->toBeNull()
        ->and($subscriptionB->fresh()->is_active)->toBeTrue();
});

test('invalid unsubscribe token returns not found', function () {
    $this->get(route('unsubscribe.show', str_repeat('a', 64)))
        ->assertNotFound();
});
