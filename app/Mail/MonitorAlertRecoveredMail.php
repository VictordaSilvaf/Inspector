<?php

namespace App\Mail;

use App\Models\AlertSubscription;
use App\Models\MonitorAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonitorAlertRecoveredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public MonitorAlert $alert,
        public AlertSubscription $subscription,
    ) {}

    public function envelope(): Envelope
    {
        $monitorName = $this->alert->apiMonitor?->name ?? 'API';

        return new Envelope(
            subject: "Recuperada: {$monitorName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.monitor-alert-recovered',
            with: [
                'monitorName' => $this->alert->apiMonitor?->name ?? 'API',
                'monitorUrl' => $this->alert->apiMonitor?->url ?? '',
                'alertName' => $this->alert->name ?? $this->alert->type->value,
                'unsubscribeUrl' => route('unsubscribe.show', $this->subscription->unsubscribe_token),
            ],
        );
    }
}
