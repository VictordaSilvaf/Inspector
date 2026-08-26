<?php

namespace App\Services\Security;

use App\Exceptions\InvalidMonitorUrlException;

final class MonitorUrlGuard
{
    private const array BLOCKED_HOST_SUFFIXES = [
        '.localhost',
        '.local',
        '.internal',
    ];

    private const array BLOCKED_HOSTS = [
        'localhost',
        'metadata.google.internal',
        'metadata.google',
    ];

    public function assertSafe(string $url): void
    {
        $parts = parse_url($url);

        if ($parts === false) {
            throw new InvalidMonitorUrlException(
                'Informe uma URL válida (ex.: https://api.exemplo.com).',
                'invalid_url',
            );
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));

        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new InvalidMonitorUrlException(
                'A URL deve começar com http:// ou https://.',
                'invalid_scheme',
            );
        }

        if ((bool) config('services.monitor_urls.require_https', false) && $scheme !== 'https') {
            throw new InvalidMonitorUrlException(
                'A URL do monitor deve usar HTTPS.',
                'https_required',
            );
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            throw new InvalidMonitorUrlException(
                'A URL não pode conter credenciais embutidas.',
                'userinfo_not_allowed',
            );
        }

        $host = strtolower(trim((string) ($parts['host'] ?? '')));

        if ($host === '') {
            throw new InvalidMonitorUrlException(
                'Informe uma URL válida (ex.: https://api.exemplo.com).',
                'missing_host',
            );
        }

        $host = $this->normalizeHost($host);

        $this->assertHostAllowed($host);

        if ($this->isIpAddress($host)) {
            $this->assertIpAllowed($host);

            return;
        }

        if (! (bool) config('services.monitor_urls.require_dns', true)) {
            return;
        }

        $this->assertResolvedIpsAllowed($host);
    }

    private function assertHostAllowed(string $host): void
    {
        if (in_array($host, self::BLOCKED_HOSTS, true)) {
            throw new InvalidMonitorUrlException(
                'Este endereço não pode ser monitorado.',
                'blocked_hostname',
            );
        }

        foreach (self::BLOCKED_HOST_SUFFIXES as $suffix) {
            if (str_ends_with($host, $suffix)) {
                throw new InvalidMonitorUrlException(
                    'Este endereço não pode ser monitorado.',
                    'blocked_hostname',
                );
            }
        }
    }

    private function assertResolvedIpsAllowed(string $host): void
    {
        $resolvedIps = $this->resolveHostIps($host);

        if ($resolvedIps === []) {
            throw new InvalidMonitorUrlException(
                'Não foi possível resolver o endereço informado.',
                'unresolved_host',
            );
        }

        foreach ($resolvedIps as $ip) {
            $this->assertIpAllowed($ip);
        }
    }

    /**
     * @return list<string>
     */
    private function resolveHostIps(string $host): array
    {
        $resolvedIps = [];
        $records = @dns_get_record($host, DNS_A + DNS_AAAA);

        if (is_array($records)) {
            foreach ($records as $record) {
                if (isset($record['ip'])) {
                    $resolvedIps[] = $record['ip'];
                }

                if (isset($record['ipv6'])) {
                    $resolvedIps[] = $record['ipv6'];
                }
            }
        }

        if ($resolvedIps !== []) {
            return array_values(array_unique($resolvedIps));
        }

        $fallbackIps = gethostbynames($host);

        if ($fallbackIps === false) {
            return [];
        }

        return array_values(array_unique($fallbackIps));
    }

    private function assertIpAllowed(string $ip): void
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP)) {
            throw new InvalidMonitorUrlException(
                'Informe uma URL válida (ex.: https://api.exemplo.com).',
                'invalid_ip',
            );
        }

        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            throw new InvalidMonitorUrlException(
                'Endereços de rede privada ou reservada não podem ser monitorados.',
                'private_or_reserved_ip',
            );
        }

        if ($this->isCarrierGradeNat($ip)) {
            throw new InvalidMonitorUrlException(
                'Endereços de rede privada ou reservada não podem ser monitorados.',
                'private_or_reserved_ip',
            );
        }
    }

    private function isIpAddress(string $host): bool
    {
        return filter_var($host, FILTER_VALIDATE_IP) !== false;
    }

    private function normalizeHost(string $host): string
    {
        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            return substr($host, 1, -1);
        }

        return $host;
    }

    private function isCarrierGradeNat(string $ip): bool
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
            return false;
        }

        $long = ip2long($ip);

        if ($long === false) {
            return false;
        }

        $start = ip2long('100.64.0.0');
        $end = ip2long('100.127.255.255');

        return $long >= $start && $long <= $end;
    }
}
