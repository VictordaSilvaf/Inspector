<?php

test('home page shares seo defaults', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('welcome')
        ->has('seo', fn ($seo) => $seo
            ->has('siteName')
            ->has('defaultTitle')
            ->has('defaultDescription')
            ->has('keywords')
            ->has('ogImage')
            ->has('twitterHandle')
            ->has('locale')
            ->has('url')
        ));
});

test('sitemap is available as xml', function () {
    $response = $this->get(route('sitemap'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/xml');
    $response->assertSee(route('home'), false);
    $response->assertSee(route('login'), false);
    $response->assertSee(route('register'), false);
});

test('robots.txt blocks private app areas and references sitemap', function () {
    $response = $this->get(route('robots'));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/plain; charset=UTF-8');
    $response->assertSee('Disallow: /dashboard');
    $response->assertSee('Disallow: /api-inspector');
    $response->assertSee('Disallow: /settings');
    $response->assertSee('Sitemap: '.route('sitemap'));
});

test('app blade includes default seo meta tags', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertSee('name="description"', false);
    $response->assertSee(config('seo.default_description'), false);
    $response->assertSee('name="keywords"', false);
});
