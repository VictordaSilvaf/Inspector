<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\Billing\UserPlanSynchronizer;
use Laravel\Cashier\Events\WebhookReceived;

final class SyncUserPlanFromStripeWebhook
{
    /**
     * @var list<string>
     */
    private const HANDLED_EVENTS = [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
    ];

    public function __construct(
        private readonly UserPlanSynchronizer $userPlanSynchronizer,
    ) {}

    public function handle(WebhookReceived $event): void
    {
        $type = $event->payload['type'] ?? null;

        if (! is_string($type) || ! in_array($type, self::HANDLED_EVENTS, true)) {
            return;
        }

        $user = $this->resolveUser($event->payload);

        if ($user === null) {
            return;
        }

        $this->userPlanSynchronizer->sync($user);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveUser(array $payload): ?User
    {
        /** @var array<string, mixed> $object */
        $object = $payload['data']['object'] ?? [];

        $customerId = $object['customer'] ?? null;

        if (! is_string($customerId) || $customerId === '') {
            return null;
        }

        return User::query()->where('stripe_id', $customerId)->first();
    }
}
