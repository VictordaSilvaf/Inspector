# syntax=docker/dockerfile:1

FROM composer:2 AS composer

FROM node:22-bookworm-slim AS node

FROM php:8.5-cli-bookworm AS php-cli-ext

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        git \
        unzip \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        zip \
        intl \
        bcmath \
        pcntl \
        gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/*

FROM php-cli-ext AS builder

COPY --from=composer /usr/bin/composer /usr/bin/composer
COPY --from=node /usr/local /usr/local

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && printf '%s\n' \
        'APP_NAME=Inspector' \
        'APP_ENV=production' \
        'APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' \
        'APP_DEBUG=false' \
        'APP_URL=http://localhost' \
        > .env \
    && php artisan package:discover --ansi \
    && npm run build \
    && rm -rf node_modules \
    && rm -f .env

FROM php:8.5-fpm-bookworm AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        nginx \
        supervisor \
        curl \
        iptables \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        zip \
        intl \
        bcmath \
        pcntl \
        gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $PHPIZE_DEPS \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default \
    && mkdir -p /var/log/supervisor

COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/queue-entrypoint.sh /docker/queue-entrypoint.sh
COPY docker/scripts/setup-queue-egress.sh /docker/scripts/setup-queue-egress.sh

RUN sed -i 's|^listen = .*|listen = 127.0.0.1:9000|' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|^;clear_env = no|clear_env = no|' /usr/local/etc/php-fpm.d/www.conf \
    && chmod +x /usr/local/bin/entrypoint.sh /docker/queue-entrypoint.sh /docker/scripts/setup-queue-egress.sh

WORKDIR /var/www/html

COPY --from=builder --chown=www-data:www-data /app /var/www/html

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
