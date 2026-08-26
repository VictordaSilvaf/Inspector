#!/usr/bin/env sh
set -eu

cd /var/www/html

mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    bootstrap/cache \
    /var/www/html/tmp

chown -R www-data:www-data storage bootstrap/cache /var/www/html/tmp || true
chmod -R ug+rwx storage bootstrap/cache /var/www/html/tmp || true

export TMPDIR=/var/www/html/tmp

php artisan package:discover --ansi >/dev/null 2>&1 || true
php artisan storage:link --force --ansi >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force --ansi
fi

if [ "${CACHE_CONFIG:-true}" = "true" ]; then
    php artisan config:cache --ansi
    php artisan route:cache --ansi
    php artisan view:cache --ansi
    chown -R www-data:www-data storage bootstrap/cache || true
fi

exec "$@"
