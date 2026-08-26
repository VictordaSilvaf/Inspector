<?php

namespace App\Mail;

use App\Models\NotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificationChannelVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public NotificationChannel $channel,
        public string $code,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Código de verificação do canal de notificação',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.notification-channel-verification',
            with: [
                'code' => $this->code,
                'expiresInMinutes' => 10,
            ],
        );
    }
}
