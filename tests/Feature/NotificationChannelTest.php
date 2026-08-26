<?php

use App\Enums\NotificationChannelVerificationStatus;
use App\Mail\NotificationChannelVerificationMail;
use App\Models\NotificationChannel;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('authenticated users can create a pending email notification channel', function () {
    Mail::fake();

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('notification-channels.store'), [
        'type' => 'email',
        'value' => 'alerts@example.com',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('notification-channels.index'));

    $channel = NotificationChannel::query()->first();

    expect($channel)->not->toBeNull()
        ->and($channel->user_id)->toBe($user->id)
        ->and($channel->value)->toBe('alerts@example.com')
        ->and($channel->verification_status)->toBe(NotificationChannelVerificationStatus::Pending);

    Mail::assertSent(NotificationChannelVerificationMail::class, function (NotificationChannelVerificationMail $mail) use ($channel): bool {
        return $mail->hasTo('alerts@example.com')
            && $mail->channel->is($channel)
            && strlen($mail->code) === 6;
    });
});

test('users can verify a notification channel with a valid otp', function () {
    Mail::fake();

    $user = User::factory()->create();
    $channel = NotificationChannel::factory()->for($user)->create();

    $this->actingAs($user)->post(route('notification-channels.send-verification', $channel));

    $code = null;

    Mail::assertSent(NotificationChannelVerificationMail::class, function (NotificationChannelVerificationMail $mail) use (&$code): bool {
        $code = $mail->code;

        return true;
    });

    $response = $this->actingAs($user)->post(route('notification-channels.verify', $channel), [
        'code' => $code,
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('notification-channels.index'));

    expect($channel->fresh()->verification_status)->toBe(NotificationChannelVerificationStatus::Verified)
        ->and($channel->fresh()->verified_at)->not->toBeNull();
});

test('invalid otp fails verification and increments attempts', function () {
    Mail::fake();

    $user = User::factory()->create();
    $channel = NotificationChannel::factory()->for($user)->create();

    $this->actingAs($user)->post(route('notification-channels.send-verification', $channel));

    $response = $this->actingAs($user)->from(route('notification-channels.index'))
        ->post(route('notification-channels.verify', $channel), [
            'code' => '000000',
        ]);

    $response->assertSessionHasErrors('code');

    expect($channel->verifications()->latest('id')->first()->attempts)->toBe(1)
        ->and($channel->fresh()->verification_status)->toBe(NotificationChannelVerificationStatus::Pending);
});

test('users cannot manage another users notification channel', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $channel = NotificationChannel::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->delete(route('notification-channels.destroy', $channel))
        ->assertForbidden();
});
