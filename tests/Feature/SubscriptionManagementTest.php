<?php

use App\Enums\SubscriptionPlan;
use App\Models\ApiMonitor;
use App\Models\NotificationChannel;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('home page includes plan catalog', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('plans', 3)
            ->where('plans.0.id', SubscriptionPlan::Free->value)
            ->where('plans.1.id', SubscriptionPlan::Pro->value)
            ->where('plans.2.id', SubscriptionPlan::Business->value)
        );
});

test('authenticated users can view subscription settings', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();

    $this->actingAs($user)
        ->get(route('subscription.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/subscription')
            ->where('currentPlan', SubscriptionPlan::Pro->value)
            ->has('plans', 3)
            ->has('usage')
        );
});

test('guests cannot access subscription settings', function () {
    $this->get(route('subscription.edit'))
        ->assertRedirect(route('login'));
});

test('verified users can upgrade their plan', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Free)->create();

    $this->actingAs($user)
        ->patch(route('subscription.update'), [
            'plan' => SubscriptionPlan::Pro->value,
        ])
        ->assertRedirect(route('subscription.edit'));

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Pro);
});

test('users cannot downgrade when monitor count exceeds plan limit', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();
    ApiMonitor::factory()->count(4)->for($user)->create();

    $this->actingAs($user)
        ->patch(route('subscription.update'), [
            'plan' => SubscriptionPlan::Free->value,
        ])
        ->assertSessionHasErrors('plan');

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Pro);
});

test('users cannot subscribe to business without two factor authentication', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();

    $this->actingAs($user)
        ->patch(route('subscription.update'), [
            'plan' => SubscriptionPlan::Business->value,
        ])
        ->assertSessionHasErrors('plan');

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Pro);
});

test('users with two factor can subscribe to business plan', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->withTwoFactor()->create();

    $this->actingAs($user)
        ->patch(route('subscription.update'), [
            'plan' => SubscriptionPlan::Business->value,
        ])
        ->assertRedirect(route('subscription.edit'));

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Business);
});

test('users cannot downgrade when notification channels exceed plan limit', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();
    NotificationChannel::factory()->count(2)->for($user)->create();

    $this->actingAs($user)
        ->patch(route('subscription.update'), [
            'plan' => SubscriptionPlan::Free->value,
        ])
        ->assertSessionHasErrors('plan');

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Pro);
});
