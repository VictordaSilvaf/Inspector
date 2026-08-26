<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('webhook-inspector.index'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the webhook inspector index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('webhook-inspector.index'));
    $response->assertOk();
});

test('authenticated users can visit the webhook inspector create page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('webhook-inspector.create'));
    $response->assertOk();
});
