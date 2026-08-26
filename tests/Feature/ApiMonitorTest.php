<?php

use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Models\ApiMonitorSecret;
use App\Models\User;
use App\Services\ApiMonitorSecretService;
use Illuminate\Support\Facades\Http;

test('guests are redirected when listing api monitors', function () {
    $response = $this->get(route('api-inspector.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can list their api monitors', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $monitor = ApiMonitor::factory()->for($user)->create([
        'name' => 'Public API',
        'url' => 'https://api.example.com/health',
        'interval_seconds' => 30,
    ]);

    ApiMonitor::factory()->for($otherUser)->create([
        'name' => 'Private API',
    ]);

    $response = $this->actingAs($user)->get(route('api-inspector.index'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/index')
            ->has('monitors', 1)
            ->where('monitors.0.id', $monitor->id)
            ->where('monitors.0.name', 'Public API')
            ->where('monitors.0.url', 'https://api.example.com/health')
            ->where('monitors.0.httpMethod', 'GET')
            ->where('monitors.0.intervalSeconds', 30)
        );
});

test('authenticated users can visit the api inspector create page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('api-inspector.create'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('ApiInspector/create'));
});

test('guests are redirected when fetching api monitor status', function () {
    $response = $this->get(route('api-inspector.status'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can fetch live status for their api monitors', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $monitor = ApiMonitor::factory()->for($user)->create([
        'name' => 'Public API',
        'last_status' => 'success',
        'last_response_time_ms' => 120,
        'last_checked_at' => now(),
    ]);

    ApiMonitor::factory()->for($otherUser)->create([
        'name' => 'Private API',
        'last_status' => 'error',
    ]);

    $response = $this->actingAs($user)->getJson(route('api-inspector.status'));

    $response
        ->assertOk()
        ->assertJsonCount(1, 'monitors')
        ->assertJsonPath('monitors.0.id', $monitor->id)
        ->assertJsonPath('monitors.0.lastStatus', 'success')
        ->assertJsonPath('monitors.0.lastResponseTimeMs', 120);
});

test('guests are redirected when storing an api monitor', function () {
    $response = $this->post(route('api-inspector.store'), [
        'name' => 'Test API',
        'url' => 'https://api.example.com',
        'http_method' => 'GET',
        'auth_type' => 'none',
    ]);

    $response->assertRedirect(route('login'));
});

test('authenticated users can store an api monitor', function () {
    Http::fake([
        'https://api.example.com/health' => Http::response(['ok' => true], 200),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('api-inspector.store'), [
        'name' => 'Health Check',
        'url' => 'https://api.example.com/health',
        'http_method' => 'GET',
        'interval_seconds' => 60,
        'auth_type' => 'none',
        'custom_headers' => [
            ['key' => 'Accept', 'value' => 'application/json'],
        ],
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('api-inspector.index'));

    $monitor = ApiMonitor::query()->first();

    expect($monitor)->not->toBeNull();
    expect($monitor->user_id)->toBe($user->id);
    expect($monitor->name)->toBe('Health Check');
    expect($monitor->url)->toBe('https://api.example.com/health');
    expect($monitor->interval_seconds)->toBe(60);
    expect($monitor->auth_type)->toBe('none');
    expect($monitor->last_status)->toBe('success');

    expect(ApiMonitorCheck::query()->count())->toBe(1);
});

test('store api monitor requires a name', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->from(route('api-inspector.create'))->post(route('api-inspector.store'), [
        'name' => '',
        'url' => 'https://api.example.com/health',
        'http_method' => 'GET',
        'auth_type' => 'none',
    ]);

    $response
        ->assertSessionHasErrors('name')
        ->assertRedirect(route('api-inspector.create'));

    expect(ApiMonitor::query()->count())->toBe(0);
});

test('store api monitor requires a valid interval', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->from(route('api-inspector.create'))->post(route('api-inspector.store'), [
        'name' => 'Health Check',
        'url' => 'https://api.example.com/health',
        'http_method' => 'GET',
        'interval_seconds' => 45,
        'auth_type' => 'none',
    ]);

    $response
        ->assertSessionHasErrors('interval_seconds')
        ->assertRedirect(route('api-inspector.create'));

    expect(ApiMonitor::query()->count())->toBe(0);
});

test('store api monitor requires bearer token when auth type is bearer', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->from(route('api-inspector.create'))->post(route('api-inspector.store'), [
        'name' => 'Secure API',
        'url' => 'https://api.example.com/secure',
        'http_method' => 'GET',
        'auth_type' => 'bearer',
        'auth_config' => [],
    ]);

    $response
        ->assertSessionHasErrors('auth_config.token')
        ->assertRedirect(route('api-inspector.create'));
});

test('store api monitor rejects internal urls', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->from(route('api-inspector.create'))->post(route('api-inspector.store'), [
        'name' => 'Internal API',
        'url' => 'http://127.0.0.1/health',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'none',
    ]);

    $response
        ->assertSessionHasErrors('url')
        ->assertRedirect(route('api-inspector.create'));

    expect(ApiMonitor::query()->count())->toBe(0);
});

test('update api monitor rejects internal urls', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/health',
    ]);

    $response = $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => $monitor->name,
        'url' => 'http://localhost/health',
        'http_method' => $monitor->http_method,
        'interval_seconds' => $monitor->interval_seconds,
        'auth_type' => 'none',
    ]);

    $response->assertSessionHasErrors('url');
    expect($monitor->fresh()->url)->toBe('https://api.example.com/health');
});

test('guests are redirected when viewing an api monitor', function () {
    $monitor = ApiMonitor::factory()->create();

    $response = $this->get(route('api-inspector.show', $monitor));

    $response->assertRedirect(route('login'));
});

test('users cannot view another users api monitor', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->create();

    $response = $this->actingAs($user)->get(route('api-inspector.show', $monitor));

    $response->assertForbidden();
});

test('authenticated users can view their api monitor details without secrets', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->withBearerAuth('hidden-token')->create([
        'name' => 'Public API',
        'url' => 'https://api.example.com/health',
        'interval_seconds' => 30,
    ]);

    $check = ApiMonitorCheck::factory()->for($monitor)->create([
        'status' => 'success',
        'http_status_code' => 200,
        'response_time_ms' => 120,
        'triggered_by' => 'scheduled',
    ]);

    $response = $this->actingAs($user)->get(route('api-inspector.show', $monitor));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/show')
            ->where('monitor.id', $monitor->id)
            ->where('monitor.name', 'Public API')
            ->where('monitor.url', 'https://api.example.com/health')
            ->where('monitor.intervalSeconds', 30)
            ->where('monitor.authConfig.configured', true)
            ->has('checks.data', 1)
            ->where('checks.data.0.id', $check->id)
            ->where('checks.data.0.status', 'success')
            ->where('checks.data.0.httpStatusCode', 200)
            ->missing('monitor.authConfig.token')
            ->missing('monitor.authConfig.password')
            ->missing('monitor.authConfig.apiKey')
        );
});

test('authenticated users can paginate api monitor checks for infinite scroll', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create();

    ApiMonitorCheck::factory()
        ->for($monitor)
        ->count(16)
        ->sequence(fn ($sequence) => [
            'checked_at' => now()->subMinutes($sequence->index),
        ])
        ->create();

    $response = $this->actingAs($user)->get(route('api-inspector.show', [
        'api_monitor' => $monitor,
        'page' => 2,
    ]));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/show')
            ->has('checks.data', 1)
            ->where('checks.current_page', 2)
            ->where('checks.last_page', 2)
            ->where('checks.total', 16)
        );
});

test('authenticated users can update their api monitor', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'name' => 'Old name',
        'url' => 'https://api.example.com/old',
        'interval_seconds' => 30,
        'auth_type' => 'none',
    ]);

    $response = $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => 'New name',
        'url' => 'https://api.example.com/new',
        'http_method' => 'POST',
        'interval_seconds' => 60,
        'auth_type' => 'bearer',
        'auth_config' => [
            'token' => 'updated-token',
        ],
        'custom_headers' => [
            ['key' => 'Accept', 'value' => 'application/json'],
        ],
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('api-inspector.show', $monitor));

    $monitor->refresh();

    expect($monitor->name)->toBe('New name');
    expect($monitor->url)->toBe('https://api.example.com/new');
    expect($monitor->http_method)->toBe('POST');
    expect($monitor->interval_seconds)->toBe(60);
    expect($monitor->auth_type)->toBe('bearer');
    expect(app(ApiMonitorSecretService::class)->resolve($monitor))
        ->toBe(['token' => 'updated-token']);
});

test('authenticated users can update monitor url without resubmitting bearer token', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->withBearerAuth('keep-me')->create([
        'url' => 'https://api.example.com/old',
    ]);

    $response = $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => $monitor->name,
        'url' => 'https://api.example.com/new-url',
        'http_method' => $monitor->http_method,
        'interval_seconds' => $monitor->interval_seconds,
        'auth_type' => 'bearer',
        'auth_config' => [],
        'custom_headers' => [
            ['key' => 'Accept'],
        ],
    ]);

    $response->assertSessionHasNoErrors();

    $monitor->refresh();

    expect($monitor->url)->toBe('https://api.example.com/new-url');
    expect(app(ApiMonitorSecretService::class)->resolve($monitor))
        ->toBe(['token' => 'keep-me']);
});

test('users cannot update another users api monitor', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->create([
        'name' => 'Private API',
    ]);

    $response = $this->actingAs($user)->put(route('api-inspector.update', $monitor), [
        'name' => 'Hacked',
        'url' => 'https://api.example.com/hacked',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'none',
    ]);

    $response->assertForbidden();

    expect($monitor->fresh()->name)->toBe('Private API');
});

test('store api monitor persists secrets in dedicated table', function () {
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
            'token' => 'store-token',
        ],
    ])->assertSessionHasNoErrors();

    $monitor = ApiMonitor::query()->first();

    expect($monitor)->not->toBeNull();
    expect(ApiMonitorSecret::query()->where('api_monitor_id', $monitor->id)->exists())->toBeTrue();
    expect(app(ApiMonitorSecretService::class)->resolve($monitor))
        ->toBe(['token' => 'store-token']);
});
