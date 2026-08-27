<?php

use App\Http\Controllers\ApiInspector\ApiMonitorController;
use App\Http\Controllers\ApiInspector\MonitorAlertController;
use App\Http\Controllers\ApiInspector\MonitorSecretAuditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\UnsubscribeController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('robots.txt', RobotsController::class)->name('robots');
Route::get('sitemap.xml', SitemapController::class)->name('sitemap');

Route::get('/', WelcomeController::class)->name('home');

Route::get('unsubscribe/{token}', [UnsubscribeController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('unsubscribe.show');
Route::post('unsubscribe/{token}', [UnsubscribeController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('unsubscribe.store');

Route::middleware(['auth', 'verified', 'plan.two-factor'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('api-inspector')->name('api-inspector.')->group(function () {
        Route::get('/', [ApiMonitorController::class, 'index'])->name('index');
        Route::get('status', [ApiMonitorController::class, 'status'])->name('status');
        Route::get('create', [ApiMonitorController::class, 'create'])->name('create');
        Route::post('/', [ApiMonitorController::class, 'store'])
            ->middleware('throttle.monitors:store')
            ->name('store');
        Route::get('{api_monitor}/alerts', [MonitorAlertController::class, 'index'])
            ->name('alerts.index');
        Route::get('{api_monitor}/audit', [MonitorSecretAuditController::class, 'index'])
            ->name('audit.index');
        Route::get('{api_monitor}/audit/export', [MonitorSecretAuditController::class, 'export'])
            ->name('audit.export');
        Route::post('{api_monitor}/alerts', [MonitorAlertController::class, 'store'])
            ->name('alerts.store');
        Route::delete('{api_monitor}/alerts/{monitor_alert}', [MonitorAlertController::class, 'destroy'])
            ->name('alerts.destroy');
        Route::put('{api_monitor}/alerts/{monitor_alert}/subscriptions', [MonitorAlertController::class, 'syncSubscriptions'])
            ->name('alerts.subscriptions.sync');

        Route::get('{api_monitor}', [ApiMonitorController::class, 'show'])->name('show');
        Route::put('{api_monitor}', [ApiMonitorController::class, 'update'])
            ->middleware('throttle.monitors:update')
            ->name('update');
    });

    Route::prefix('webhook-inspector')->name('webhook-inspector.')->group(function () {
        Route::inertia('/', 'WebhookInspector/index')->name('index');
        Route::inertia('create', 'WebhookInspector/create')->name('create');
    });
});

require __DIR__.'/settings.php';
