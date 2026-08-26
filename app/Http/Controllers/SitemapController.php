<?php

namespace App\Http\Controllers;

use App\Support\Seo;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        return response()
            ->view('sitemap', [
                'entries' => Seo::sitemapEntries(),
            ])
            ->header('Content-Type', 'application/xml');
    }
}
