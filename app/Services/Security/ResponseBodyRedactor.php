<?php

namespace App\Services\Security;

class ResponseBodyRedactor
{
    private const string Redacted = '[REDACTED]';

    /**
     * @var list<string>
     */
    private const array SensitiveJsonKeys = [
        'access_token',
        'api_key',
        'apikey',
        'authorization',
        'bearer',
        'client_secret',
        'jwt',
        'password',
        'refresh_token',
        'secret',
        'token',
    ];

    public function redact(string $body): string
    {
        if ($body === '') {
            return $body;
        }

        $redacted = $this->redactSensitiveJsonKeys($body);
        $redacted = $this->redactBearerTokens($redacted);
        $redacted = $this->redactJwts($redacted);
        $redacted = $this->redactBasicAuth($redacted);

        return $redacted;
    }

    private function redactSensitiveJsonKeys(string $body): string
    {
        $keysPattern = implode('|', array_map(
            static fn (string $key): string => preg_quote($key, '/'),
            self::SensitiveJsonKeys,
        ));

        $body = (string) preg_replace(
            '/"((?:'.$keysPattern.')[^"]*)"\s*:\s*"(?:[^"\\\\]|\\\\.)*"/iu',
            '"$1": "'.self::Redacted.'"',
            $body,
        );

        return (string) preg_replace(
            '/"((?:'.$keysPattern.')[^"]*)"\s*:\s*(?!"(?:[^"\\\\]|\\\\.)*")(?:[^,}\]\s]+)/iu',
            '"$1": "'.self::Redacted.'"',
            $body,
        );
    }

    private function redactBearerTokens(string $body): string
    {
        return (string) preg_replace(
            '/\bBearer\s+[A-Za-z0-9\-._~+\/]+=*/i',
            'Bearer '.self::Redacted,
            $body,
        );
    }

    private function redactJwts(string $body): string
    {
        return (string) preg_replace(
            '/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/',
            self::Redacted,
            $body,
        );
    }

    private function redactBasicAuth(string $body): string
    {
        return (string) preg_replace(
            '/\bBasic\s+[A-Za-z0-9+\/=]{8,}/i',
            'Basic '.self::Redacted,
            $body,
        );
    }
}
