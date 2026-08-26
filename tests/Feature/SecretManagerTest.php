<?php

use App\Services\Security\SecretManager;

test('secret manager encrypts and decrypts payloads', function () {
    $manager = app(SecretManager::class);

    $payload = ['token' => 'secret-value', 'nested' => ['a' => 1]];

    $encrypted = $manager->encrypt($payload);

    expect($encrypted)->not->toBeEmpty();
    expect($manager->decrypt($encrypted))->toBe($payload);
});

test('secret manager rejects invalid ciphertext', function () {
    $manager = app(SecretManager::class);

    expect(fn () => $manager->decrypt('invalid-ciphertext'))
        ->toThrow(RuntimeException::class);
});
