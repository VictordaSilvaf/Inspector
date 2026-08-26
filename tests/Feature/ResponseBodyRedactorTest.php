<?php

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\ApiMonitorChecker;
use App\Services\Security\ResponseBodyRedactor;
use Illuminate\Support\Facades\Http;

test('response body redactor redacts sensitive json keys', function () {
    $redactor = app(ResponseBodyRedactor::class);

    $body = '{"username":"john","password":"super-secret","access_token":"abc123xyz"}';

    expect($redactor->redact($body))
        ->toContain('"password": "[REDACTED]"')
        ->toContain('"access_token": "[REDACTED]"')
        ->toContain('"username":"john"')
        ->not->toContain('super-secret')
        ->not->toContain('abc123xyz');
});

test('response body redactor redacts bearer tokens in text', function () {
    $redactor = app(ResponseBodyRedactor::class);

    $body = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';

    expect($redactor->redact($body))
        ->toContain('Bearer [REDACTED]')
        ->not->toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig');
});

test('response body redactor redacts standalone jwt tokens', function () {
    $redactor = app(ResponseBodyRedactor::class);

    $jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    $body = "Token received: {$jwt}";

    expect($redactor->redact($body))
        ->toBe('Token received: [REDACTED]');
});

test('response body redactor redacts basic auth credentials', function () {
    $redactor = app(ResponseBodyRedactor::class);

    $body = 'Proxy-Authorization: Basic dXNlcjpwYXNzd29yZA==';

    expect($redactor->redact($body))
        ->toContain('Basic [REDACTED]')
        ->not->toContain('dXNlcjpwYXNzd29yZA==');
});

test('response body redactor leaves safe bodies unchanged', function () {
    $redactor = app(ResponseBodyRedactor::class);

    $body = '{"status":"ok","message":"All systems operational","count":42}';

    expect($redactor->redact($body))->toBe($body);
});

test('checker stores redacted response body preview', function () {
    Http::fake([
        'https://api.example.com/health' => Http::response(
            '{"status":"ok","password":"leaked-password","token":"secret-token-value"}',
            200,
        ),
    ]);

    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/health',
        'expected_status_code' => 200,
    ]);

    $check = app(ApiMonitorChecker::class)->check($monitor);

    expect($check->response_body_preview)
        ->toContain('[REDACTED]')
        ->not->toContain('leaked-password')
        ->not->toContain('secret-token-value');
});
