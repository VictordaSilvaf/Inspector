<?php

use App\Models\ApiMonitor;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.totalMonitors', 0)
            ->where('stats.activeMonitors', 0)
            ->where('stats.failingMonitors', 0)
            ->where('stats.averageResponseTimeMs', 0)
            ->where('stats.notificationChannels', 0)
            ->has('monitors', 0)
        );
});

test('dashboard includes monitor stats and recent monitors', function () {
    $user = User::factory()->create();

    ApiMonitor::factory()->for($user)->create([
        'name' => 'Health API',
        'is_active' => true,
        'consecutive_failures' => 0,
        'last_response_time_ms' => 120,
        'last_status' => 'success',
    ]);

    ApiMonitor::factory()->for($user)->create([
        'name' => 'Failing API',
        'is_active' => true,
        'consecutive_failures' => 2,
        'last_response_time_ms' => 800,
        'last_status' => 'error',
    ]);

    ApiMonitor::factory()->for($user)->create([
        'name' => 'Paused API',
        'is_active' => false,
        'consecutive_failures' => 0,
        'last_response_time_ms' => null,
        'last_status' => null,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.totalMonitors', 3)
            ->where('stats.activeMonitors', 2)
            ->where('stats.failingMonitors', 1)
            ->where('stats.averageResponseTimeMs', 460)
            ->has('monitors', 3)
            ->where('monitors.0.isActive', false)
            ->where('monitors.0.name', 'Paused API')
        );
});
