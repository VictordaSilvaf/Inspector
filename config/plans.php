<?php

use App\Enums\SubscriptionPlan;

return [

    'intervals' => [5, 10, 15, 30, 60],

    'default_highlighted' => SubscriptionPlan::Pro->value,

    'tiers' => [
        SubscriptionPlan::Free->value => [
            'max_monitors' => 3,
            'min_interval_seconds' => 30,
            'max_alerts_per_monitor' => 1,
            'max_notification_channels' => 1,
            'history_retention_days' => 7,
            'credential_audit' => false,
            'credential_audit_export' => false,
            'requires_two_factor' => false,
            'monthly_price_cents' => 0,
            'stripe_price_id' => null,
            'description' => 'Para experimentar e monitorar poucos endpoints.',
        ],
        SubscriptionPlan::Pro->value => [
            'max_monitors' => 10,
            'min_interval_seconds' => 15,
            'max_alerts_per_monitor' => null,
            'max_notification_channels' => 5,
            'history_retention_days' => 30,
            'credential_audit' => true,
            'credential_audit_export' => false,
            'requires_two_factor' => false,
            'monthly_price_cents' => 999,
            'stripe_price_id' => env('STRIPE_PRICE_PRO'),
            'description' => 'Para times que precisam de mais monitores e alertas.',
        ],
        SubscriptionPlan::Business->value => [
            'max_monitors' => 100,
            'min_interval_seconds' => 5,
            'max_alerts_per_monitor' => null,
            'max_notification_channels' => null,
            'history_retention_days' => 90,
            'credential_audit' => true,
            'credential_audit_export' => true,
            'requires_two_factor' => true,
            'monthly_price_cents' => 1999,
            'stripe_price_id' => env('STRIPE_PRICE_BUSINESS'),
            'description' => 'Para produção crítica com auditoria e compliance.',
        ],
    ],

];
