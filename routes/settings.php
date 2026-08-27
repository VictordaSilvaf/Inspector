<?php

use App\Http\Controllers\Settings\NotificationChannelController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SubscriptionController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/notification-channels', [NotificationChannelController::class, 'index'])
        ->name('notification-channels.index');
    Route::post('settings/notification-channels', [NotificationChannelController::class, 'store'])
        ->name('notification-channels.store');
    Route::post('settings/notification-channels/{notification_channel}/send-verification', [NotificationChannelController::class, 'sendVerification'])
        ->middleware('throttle:6,1')
        ->name('notification-channels.send-verification');
    Route::post('settings/notification-channels/{notification_channel}/verify', [NotificationChannelController::class, 'verify'])
        ->middleware('throttle:10,1')
        ->name('notification-channels.verify');
    Route::delete('settings/notification-channels/{notification_channel}', [NotificationChannelController::class, 'destroy'])
        ->name('notification-channels.destroy');

    Route::get('settings/subscription', [SubscriptionController::class, 'edit'])
        ->name('subscription.edit');
    Route::patch('settings/subscription', [SubscriptionController::class, 'update'])
        ->name('subscription.update');
});
