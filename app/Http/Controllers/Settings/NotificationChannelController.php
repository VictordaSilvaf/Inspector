<?php

namespace App\Http\Controllers\Settings;

use App\Enums\NotificationChannelType;
use App\Enums\NotificationChannelVerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreNotificationChannelRequest;
use App\Http\Requests\Settings\VerifyNotificationChannelRequest;
use App\Models\NotificationChannel;
use App\Services\Alerts\NotificationChannelVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class NotificationChannelController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', NotificationChannel::class);

        $channels = $request->user()
            ->notificationChannels()
            ->latest()
            ->get()
            ->map(fn (NotificationChannel $channel): array => $channel->toFrontendArray());

        return Inertia::render('settings/notification-channels', [
            'channels' => $channels,
        ]);
    }

    public function store(
        StoreNotificationChannelRequest $request,
        NotificationChannelVerifier $verifier,
    ): RedirectResponse {
        $channel = $request->user()->notificationChannels()->create([
            'type' => NotificationChannelType::Email,
            'value' => $request->validated('value'),
            'verification_status' => NotificationChannelVerificationStatus::Pending,
        ]);

        $verifier->sendCode($channel);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Canal criado. Enviamos um código de verificação para o email.'),
        ]);

        return to_route('notification-channels.index');
    }

    public function sendVerification(
        NotificationChannel $notificationChannel,
        NotificationChannelVerifier $verifier,
    ): RedirectResponse {
        Gate::authorize('update', $notificationChannel);

        $verifier->sendCode($notificationChannel);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Novo código enviado.'),
        ]);

        return back();
    }

    public function verify(
        VerifyNotificationChannelRequest $request,
        NotificationChannel $notificationChannel,
        NotificationChannelVerifier $verifier,
    ): RedirectResponse {
        $verifier->verify($notificationChannel, $request->validated('code'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Canal verificado com sucesso.'),
        ]);

        return to_route('notification-channels.index');
    }

    public function destroy(NotificationChannel $notificationChannel): RedirectResponse
    {
        Gate::authorize('delete', $notificationChannel);

        $notificationChannel->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Canal removido.'),
        ]);

        return to_route('notification-channels.index');
    }
}
