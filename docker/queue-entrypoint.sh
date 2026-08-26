#!/usr/bin/env sh
set -eu

/docker/scripts/setup-queue-egress.sh

exec /usr/local/bin/entrypoint.sh "$@"
