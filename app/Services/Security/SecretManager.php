<?php

namespace App\Services\Security;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use JsonException;
use RuntimeException;

final class SecretManager
{
    private Encrypter $encrypter;

    public function __construct()
    {
        $key = config('services.monitor_secrets.key');

        if (! is_string($key) || $key === '') {
            throw new RuntimeException('MONITOR_SECRETS_KEY is not configured.');
        }

        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7), true);
        }

        if ($key === false || strlen($key) !== 32) {
            throw new RuntimeException('MONITOR_SECRETS_KEY must be a valid 32-byte key.');
        }

        $this->encrypter = new Encrypter(
            $key,
            (string) config('app.cipher'),
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function encrypt(array $payload): string
    {
        try {
            return $this->encrypter->encrypt(json_encode($payload, JSON_THROW_ON_ERROR));
        } catch (JsonException $exception) {
            throw new RuntimeException('Unable to encode secret payload.', previous: $exception);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function decrypt(string $payload): array
    {
        try {
            $decoded = json_decode(
                $this->encrypter->decrypt($payload),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );

            if (! is_array($decoded)) {
                throw new RuntimeException('Decrypted secret payload is invalid.');
            }

            return $decoded;
        } catch (DecryptException|JsonException $exception) {
            throw new RuntimeException('Unable to decrypt monitor secret.', previous: $exception);
        }
    }
}
