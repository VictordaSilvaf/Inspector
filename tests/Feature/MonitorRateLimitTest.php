<?php

use App\Mail\MonitorAbuseDetectedMail;
use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\ApiMonitorChecker;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

test('monitor store route is rate limited', function () {
    config(['monitors.rate_limit.store' => 2]);

    Http::fake([
        '*' => Http::response([], 200),
    ]);

    $user = User::factory()->create();

    foreach (range(1, 2) as $index) {
        $this->actingAs($user)->post(route('api-inspector.store'), [
            'name' => "Monitor {$index}",
            'url' => "https://api.example.com/{$index}",
            'http_method' => 'GET',
            'interval_seconds' => 30,
            'auth_type' => 'none',
        ])->assertSessionHasNoErrors();
    }

    $this->actingAs($user)->post(route('api-inspector.store'), [
        'name' => 'Monitor blocked',
        'url' => 'https://api.example.com/blocked',
        'http_method' => 'GET',
        'interval_seconds' => 30,
        'auth_type' => 'none',
    ])->assertSessionHasErrors('rate_limit');

    RateLimiter::clear("monitor-store:{$user->id}");
});

test('many blocked urls trigger abuse alert email', function () {
    Mail::fake();
    Http::fake();

    config([
        'monitors.abuse.threshold' => 3,
        'monitors.abuse.window_minutes' => 15,
        'monitors.abuse.alert_cooldown_minutes' => 60,
    ]);

    Cache::flush();

    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'http://127.0.0.1/health',
    ]);

    foreach (range(1, 3) as $attempt) {
        app(ApiMonitorChecker::class)->check($monitor->fresh(), 'scheduled');
    }

    Mail::assertSent(MonitorAbuseDetectedMail::class, function (MonitorAbuseDetectedMail $mail) use ($user): bool {
        return $mail->hasTo($user->email);
    });
});
