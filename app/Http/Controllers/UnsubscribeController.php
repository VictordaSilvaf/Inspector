<?php

namespace App\Http\Controllers;

use App\Models\AlertSubscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnsubscribeController extends Controller
{
    public function show(string $token): Response
    {
        $subscription = AlertSubscription::query()
            ->where('unsubscribe_token', $token)
            ->with(['monitorAlert.apiMonitor', 'notificationChannel'])
            ->firstOrFail();

        return Inertia::render('unsubscribe', [
            'token' => $token,
            'alreadyUnsubscribed' => ! $subscription->is_active,
            'monitorName' => $subscription->monitorAlert?->apiMonitor?->name,
            'alertName' => $subscription->monitorAlert?->name ?? $subscription->monitorAlert?->type?->value,
            'channelValue' => $subscription->notificationChannel?->value,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $subscription = AlertSubscription::query()
            ->where('unsubscribe_token', $token)
            ->firstOrFail();

        if ($subscription->is_active) {
            $subscription->unsubscribe();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Inscrição cancelada. Você não receberá mais este alerta.'),
        ]);

        return to_route('unsubscribe.show', $token);
    }
}
