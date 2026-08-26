<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;

class Seo
{
    /**
     * @return array{
     *     siteName: string,
     *     defaultTitle: string,
     *     defaultDescription: string,
     *     keywords: string,
     *     ogImage: string,
     *     twitterHandle: string|null,
     *     locale: string,
     *     url: string,
     * }
     */
    public static function shared(): array
    {
        return [
            'siteName' => (string) config('seo.site_name'),
            'defaultTitle' => (string) config('seo.default_title'),
            'defaultDescription' => (string) config('seo.default_description'),
            'keywords' => (string) config('seo.keywords'),
            'ogImage' => url((string) config('seo.og_image')),
            'twitterHandle' => config('seo.twitter_handle'),
            'locale' => str_replace('_', '-', (string) config('seo.locale')),
            'url' => rtrim((string) config('app.url'), '/'),
        ];
    }

    /**
     * @return list<array{loc: string, lastmod: string, changefreq: string, priority: string}>
     */
    public static function sitemapEntries(): array
    {
        $entries = [];

        foreach ((array) config('seo.sitemap_routes', []) as $routeName) {
            if (! is_string($routeName) || ! Route::has($routeName)) {
                continue;
            }

            $entries[] = [
                'loc' => route($routeName),
                'lastmod' => now()->toAtomString(),
                'changefreq' => $routeName === 'home' ? 'weekly' : 'monthly',
                'priority' => $routeName === 'home' ? '1.0' : '0.6',
            ];
        }

        return $entries;
    }

    public static function robotsTxt(): string
    {
        $sitemap = route('sitemap');

        return implode("\n", [
            'User-agent: *',
            'Allow: /',
            'Disallow: /dashboard',
            'Disallow: /api-inspector',
            'Disallow: /webhook-inspector',
            'Disallow: /settings',
            'Disallow: /unsubscribe',
            '',
            "Sitemap: {$sitemap}",
            '',
        ]);
    }
}
