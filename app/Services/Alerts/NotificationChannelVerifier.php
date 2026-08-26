<?php

namespace App\Services\Alerts;

use App\Enums\NotificationChannelType;
use App\Enums\NotificationChannelVerificationStatus;
use App\Mail\NotificationChannelVerificationMail;
use App\Models\NotificationChannel;
use App\Models\NotificationChannelVerification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class NotificationChannelVerifier
{
    public function sendCode(NotificationChannel $channel): void
    {
        if ($channel->type !== NotificationChannelType::Email) {
            throw new InvalidArgumentException('Apenas canais de email são suportados no momento.');
        }

        $latest = $channel->verifications()->latest('id')->first();

        if (
            $latest !== null
            && $latest->verified_at === null
            && $latest->created_at !== null
            && $latest->created_at->copy()->addSeconds(NotificationChannelVerification::ResendCooldownSeconds)->isFuture()
        ) {
            throw ValidationException::withMessages([
                'code' => 'Aguarde antes de solicitar um novo código.',
            ]);
        }

        $code = (string) random_int(100000, 999999);

        $channel->verifications()->create([
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(NotificationChannelVerification::ExpiresInMinutes),
            'attempts' => 0,
        ]);

        Mail::to($channel->value)->send(new NotificationChannelVerificationMail($channel, $code));
    }

    public function verify(NotificationChannel $channel, string $code): void
    {
        $verification = $channel->verifications()
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if ($verification === null) {
            throw ValidationException::withMessages([
                'code' => 'Nenhum código de verificação pendente.',
            ]);
        }

        if ($verification->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'O código de verificação expirou.',
            ]);
        }

        if ($verification->hasExceededAttempts()) {
            throw ValidationException::withMessages([
                'code' => 'Número máximo de tentativas excedido.',
            ]);
        }

        $verification->increment('attempts');

        if (! Hash::check($code, $verification->code_hash)) {
            throw ValidationException::withMessages([
                'code' => 'Código de verificação inválido.',
            ]);
        }

        $verification->update([
            'verified_at' => now(),
        ]);

        $channel->update([
            'verification_status' => NotificationChannelVerificationStatus::Verified,
            'verified_at' => now(),
            'is_active' => true,
        ]);
    }
}
