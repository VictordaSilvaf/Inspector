<?php

return [

    'require_two_factor_for_secrets' => env(
        'MONITOR_REQUIRE_2FA_FOR_SECRETS',
        env('APP_ENV') === 'production',
    ),

    'rate_limit' => [
        'store' => (int) env('MONITOR_STORE_RATE_LIMIT', 10),
        'update' => (int) env('MONITOR_UPDATE_RATE_LIMIT', 20),
    ],

    'abuse' => [
        'threshold' => (int) env('MONITOR_ABUSE_THRESHOLD', 5),
        'window_minutes' => (int) env('MONITOR_ABUSE_WINDOW_MINUTES', 15),
        'alert_cooldown_minutes' => (int) env('MONITOR_ABUSE_ALERT_COOLDOWN_MINUTES', 60),
    ],

];
