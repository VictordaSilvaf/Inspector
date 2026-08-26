<?php

use App\Mail\MonitorSecretChangedMail;
use App\Models\ApiMonitor;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

test('creating monitor with secrets requires current password', function () {
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
            'token' => 'secret-token',
        ],
    ])->assertSessionHasErrors('current_password');
});

test('creating monitor with secrets requires two factor when enabled', function () {
    config(['monitors.require_two_factor_for_secrets' => true]);

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
            'token' => 'secret-token',
        ],
        'current_password' => 'password',
    ])->assertSessionHasErrors('auth_type');
});

test('creating monitor with secrets succeeds when password and two factor are valid', function () {
    Mail::fake();

    Http::fake([
        'https://api.example.com/secure' => Http::response([], 200),
    ]);

    config(['monitors.require_two_factor_for_secrets' => true]);

    $user = User::factory()->withTwoFactor()->create();

    $this->actingAs($user)->post(route('api-inspector.store'), [
        'name' => 'Secure API',
        'url' => 'https://api.example.com/secure',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'bearer',
        'auth_config' => [
            'token' => 'secret-token',
        ],
        'current_password' => 'password',
    ])->assertSessionHasNoErrors();

    Mail::assertSent(MonitorSecretChangedMail::class);
});

test('rotating monitor secret requires current password', function () {
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
    ])->assertSessionHasErrors('current_password');
});

test('user cannot exceed monitor limit', function () {
    config(['monitors.max_per_user' => 2]);

    Http::fake([
        '*' => Http::response([], 200),
    ]);

    $user = User::factory()->create();

    ApiMonitor::factory()->for($user)->count(2)->create();

    $this->actingAs($user)->post(route('api-inspector.store'), [
        'name' => 'Third monitor',
        'url' => 'https://api.example.com/third',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'none',
    ])->assertSessionHasErrors('name');
});
