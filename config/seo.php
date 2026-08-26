<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Site Identity
    |--------------------------------------------------------------------------
    */

    'site_name' => env('SEO_SITE_NAME', env('APP_NAME', 'Inspector')),

    'default_title' => env(
        'SEO_DEFAULT_TITLE',
        'Inspector — Monitore APIs, webhooks e alertas',
    ),

    'default_description' => env(
        'SEO_DEFAULT_DESCRIPTION',
        'Monitore a saúde das suas APIs HTTP, acompanhe latência e receba alertas por e-mail quando algo sair do esperado.',
    ),

    'keywords' => env(
        'SEO_KEYWORDS',
        'monitoramento de api, uptime, health check, alertas, webhooks, disponibilidade, latência',
    ),

    /*
    |--------------------------------------------------------------------------
    | Social / Open Graph
    |--------------------------------------------------------------------------
    */

    'og_image' => env('SEO_OG_IMAGE', '/og-image.svg'),

    'twitter_handle' => env('SEO_TWITTER_HANDLE'),

    'locale' => env('SEO_LOCALE', env('APP_LOCALE', 'pt_BR')),

    /*
    |--------------------------------------------------------------------------
    | Sitemap
    |--------------------------------------------------------------------------
    |
    | Named routes included in sitemap.xml (public, indexable pages only).
    |
    */

    'sitemap_routes' => [
        'home',
        'login',
        'register',
    ],

];
