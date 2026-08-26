#!/usr/bin/env sh
set -eu

if [ "${EGRESS_FILTER_ENABLED:-false}" != "true" ]; then
    exit 0
fi

if ! command -v iptables >/dev/null 2>&1; then
    echo "egress filter: iptables not found, skipping" >&2
    exit 1
fi

DB_HOST="${DB_HOST:-pgsql}"
REDIS_HOST="${REDIS_HOST:-redis}"

resolve_host() {
    host="$1"
    if getent hosts "$host" >/dev/null 2>&1; then
        getent hosts "$host" | awk '{print $1}' | head -n1
        return 0
    fi

    echo "egress filter: unable to resolve ${host}" >&2
    return 1
}

DB_IP="$(resolve_host "$DB_HOST")"
REDIS_IP="$(resolve_host "$REDIS_HOST")"

echo "egress filter: applying iptables rules (db=${DB_IP}, redis=${REDIS_IP})"

iptables -F OUTPUT 2>/dev/null || true

iptables -A OUTPUT -o lo -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -d 127.0.0.11 -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -d 127.0.0.11 -p tcp --dport 53 -j ACCEPT
iptables -A OUTPUT -d "$DB_IP" -p tcp --dport 5432 -j ACCEPT
iptables -A OUTPUT -d "$REDIS_IP" -p tcp --dport 6379 -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

iptables -A OUTPUT -d 10.0.0.0/8 -j REJECT
iptables -A OUTPUT -d 172.16.0.0/12 -j REJECT
iptables -A OUTPUT -d 192.168.0.0/16 -j REJECT
iptables -A OUTPUT -d 169.254.0.0/16 -j REJECT
iptables -A OUTPUT -d 100.64.0.0/10 -j REJECT
iptables -A OUTPUT -d 127.0.0.0/8 -j REJECT
iptables -A OUTPUT -d ::1/128 -j REJECT
iptables -A OUTPUT -d fe80::/10 -j REJECT

iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -j REJECT

echo "egress filter: rules applied"
