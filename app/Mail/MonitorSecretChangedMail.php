<?php

namespace App\Mail;

use App\Models\ApiMonitor;
use App\Models\User;
use App\Services\Security\MonitorSecretAuditPresenter;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonitorSecretChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ApiMonitor $monitor,
        public string $action,
        public ?User $actor = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Credencial de monitor alterada',
        );
    }

    public function content(): Content
    {
        $presenter = app(MonitorSecretAuditPresenter::class);

        return new Content(
            markdown: 'mail.monitor-secret-changed',
            with: [
                'monitorName' => $this->monitor->name,
                'monitorUrl' => $this->monitor->url,
                'monitorId' => $this->monitor->id,
                'actionLabel' => $presenter->actionLabel($this->action),
                'actorName' => $this->actor?->name,
                'changedAt' => now()->timezone(config('app.timezone'))->format('d/m/Y H:i'),
            ],
        );
    }
}
