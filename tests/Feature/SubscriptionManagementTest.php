<?php

use App\Enums\SubscriptionPlan;
use App\Models\ApiMonitor;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Services\Billing\PlanStripeMapper;
use App\Services\Billing\StripeBillingService;
use App\Services\Billing\UserPlanSynchronizer;
use Illuminate\Http\RedirectResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Cashier\Subscription;

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
            ->has('billing')
        );
});

test('guests cannot access subscription settings', function () {
    $this->get(route('subscription.edit'))
        ->assertRedirect(route('login'));
});

test('verified users can upgrade their plan through billing service', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Free)->create();

    $this->mock(StripeBillingService::class, function ($mock) {
        $mock->shouldReceive('changePlan')
            ->once()
            ->andReturnUsing(function (User $user, SubscriptionPlan $plan) {
                $user->update(['plan' => $plan]);

                return redirect()->route('subscription.edit');
            });
    });

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

test('users with two factor can subscribe to business plan through billing service', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->withTwoFactor()->create();

    $this->mock(StripeBillingService::class, function ($mock) {
        $mock->shouldReceive('changePlan')
            ->once()
            ->andReturnUsing(function (User $user, SubscriptionPlan $plan) {
                $user->update(['plan' => $plan]);

                return redirect()->route('subscription.edit');
            });
    });

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

test('plan stripe mapper resolves configured price ids', function () {
    $mapper = app(PlanStripeMapper::class);

    expect($mapper->priceIdForPlan(SubscriptionPlan::Free))->toBeNull()
        ->and($mapper->priceIdForPlan(SubscriptionPlan::Pro))->toBe('price_test_pro')
        ->and($mapper->planForPriceId('price_test_business'))->toBe(SubscriptionPlan::Business);
});

test('user plan synchronizer updates plan from active stripe subscription', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Free)->create([
        'stripe_id' => 'cus_test_sync',
    ]);

    Subscription::query()->create([
        'user_id' => $user->id,
        'type' => 'default',
        'stripe_id' => 'sub_test_sync',
        'stripe_status' => 'active',
        'stripe_price' => 'price_test_pro',
    ]);

    app(UserPlanSynchronizer::class)->sync($user->fresh());

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Pro);
});

test('user plan synchronizer downgrades when subscription is inactive', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create([
        'stripe_id' => 'cus_test_inactive',
    ]);

    Subscription::query()->create([
        'user_id' => $user->id,
        'type' => 'default',
        'stripe_id' => 'sub_test_inactive',
        'stripe_status' => 'canceled',
        'stripe_price' => 'price_test_pro',
        'ends_at' => now()->subDay(),
    ]);

    app(UserPlanSynchronizer::class)->sync($user->fresh());

    expect($user->fresh()->plan)->toBe(SubscriptionPlan::Free);
});

test('stripe billing service downgrades user to free plan', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();

    $response = app(StripeBillingService::class)->downgradeToFree($user);

    expect($response)->toBeInstanceOf(RedirectResponse::class)
        ->and($user->fresh()->plan)->toBe(SubscriptionPlan::Free);
});
