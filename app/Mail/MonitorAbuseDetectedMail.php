<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonitorAbuseDetectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $eventType,
        public int $attemptCount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Atividade suspeita detectada no Inspector',
        );
    }

    public function content(): Content
    {
        $eventLabel = match ($this->eventType) {
            'rate_limit' => 'muitas tentativas de criar ou editar monitores',
            'url_blocked' => 'muitas URLs bloqueadas por segurança',
            default => 'atividade suspeita',
        };

        return new Content(
            markdown: 'mail.monitor-abuse-detected',
            with: [
                'userName' => $this->user->name,
                'eventLabel' => $eventLabel,
                'attemptCount' => $this->attemptCount,
                'windowMinutes' => (int) config('monitors.abuse.window_minutes', 15),
            ],
        );
    }
}
