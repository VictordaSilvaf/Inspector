<?php

use App\Enums\SubscriptionPlan;
use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\Billing\PlanLimitsService;

test('plan limits match configured tiers', function () {
    $service = app(PlanLimitsService::class);

    expect($service->forPlan(SubscriptionPlan::Free)->maxMonitors)->toBe(3)
        ->and($service->forPlan(SubscriptionPlan::Free)->allowedIntervals)->toBe([30, 60])
        ->and($service->forPlan(SubscriptionPlan::Pro)->maxMonitors)->toBe(10)
        ->and($service->forPlan(SubscriptionPlan::Pro)->allowedIntervals)->toBe([15, 30, 60])
        ->and($service->forPlan(SubscriptionPlan::Business)->maxMonitors)->toBe(100)
        ->and($service->forPlan(SubscriptionPlan::Business)->allowedIntervals)->toBe([5, 10, 15, 30, 60])
        ->and($service->forPlan(SubscriptionPlan::Free)->credentialAudit)->toBeFalse()
        ->and($service->forPlan(SubscriptionPlan::Pro)->credentialAudit)->toBeTrue()
        ->and($service->forPlan(SubscriptionPlan::Business)->credentialAuditExport)->toBeTrue();
});

test('free plan users cannot access credential audit history', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Free)->create();
    $monitor = ApiMonitor::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('api-inspector.audit.index', $monitor))
        ->assertForbidden();
});

test('business plan users can export credential audit csv', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Business)->withTwoFactor()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('api-inspector.audit.export', $monitor))
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

test('pro plan users cannot export credential audit csv', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Pro)->create();
    $monitor = ApiMonitor::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('api-inspector.audit.export', $monitor))
        ->assertForbidden();
});

test('business plan requires two factor authentication middleware', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Business)->create();

    $this->actingAs($user)
        ->get(route('api-inspector.index'))
        ->assertRedirect(route('security.edit'));
});

test('business plan with two factor can access app routes', function () {
    $user = User::factory()->onPlan(SubscriptionPlan::Business)->withTwoFactor()->create();

    $this->actingAs($user)
        ->get(route('api-inspector.index'))
        ->assertOk();
});
