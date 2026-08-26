<?php

use App\Exceptions\InvalidMonitorUrlException;
use App\Services\Security\MonitorUrlGuard;

test('monitor url guard allows public https urls', function () {
    $guard = app(MonitorUrlGuard::class);

    $guard->assertSafe('https://1.1.1.1/cdn-cgi/trace');

    expect(true)->toBeTrue();
});

test('monitor url guard blocks localhost', function () {
    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('http://localhost/health'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url guard blocks private ipv4 addresses', function () {
    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('http://127.0.0.1/health'))
        ->toThrow(InvalidMonitorUrlException::class);

    expect(fn () => $guard->assertSafe('http://10.0.0.5/health'))
        ->toThrow(InvalidMonitorUrlException::class);

    expect(fn () => $guard->assertSafe('http://192.168.1.10/health'))
        ->toThrow(InvalidMonitorUrlException::class);

    expect(fn () => $guard->assertSafe('http://169.254.169.254/latest/meta-data'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url guard blocks ipv6 loopback', function () {
    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('http://[::1]/health'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url guard blocks urls with embedded credentials', function () {
    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('http://user:pass@example.com/health'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url guard can require https when configured', function () {
    config(['services.monitor_urls.require_https' => true]);

    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('http://api.example.com/health'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url guard can require dns when configured', function () {
    config(['services.monitor_urls.require_dns' => true]);

    $guard = app(MonitorUrlGuard::class);

    expect(fn () => $guard->assertSafe('https://this-domain-should-not-exist-12345.invalid/health'))
        ->toThrow(InvalidMonitorUrlException::class);
});

test('monitor url config defaults to strict policy in production environment', function () {
    $servicesConfig = file_get_contents(config_path('services.php'));

    expect($servicesConfig)
        ->toContain("env('MONITOR_URL_REQUIRE_HTTPS', env('APP_ENV') === 'production')")
        ->toContain("env('MONITOR_URL_REQUIRE_DNS', env('APP_ENV') === 'production')");
});
