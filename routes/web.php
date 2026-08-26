<?php

use App\Http\Controllers\ApiInspector\ApiMonitorController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('api-inspector')->name('api-inspector.')->group(function () {
        Route::get('/', [ApiMonitorController::class, 'index'])->name('index');
        Route::get('status', [ApiMonitorController::class, 'status'])->name('status');
        Route::get('create', [ApiMonitorController::class, 'create'])->name('create');
        Route::post('/', [ApiMonitorController::class, 'store'])->name('store');
        Route::get('{api_monitor}', [ApiMonitorController::class, 'show'])->name('show');
        Route::put('{api_monitor}', [ApiMonitorController::class, 'update'])->name('update');
    });

    Route::prefix('webhook-inspector')->name('webhook-inspector.')->group(function () {
        Route::inertia('/', 'WebhookInspector/index')->name('index');
        Route::inertia('create', 'WebhookInspector/create')->name('create');
    });
});

require __DIR__.'/settings.php';
