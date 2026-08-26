<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('api-inspector.index'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the api inspector index', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('api-inspector.index'));

    $response
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/index')
            ->has('monitors', 0)
        );
});

test('authenticated users can visit the api inspector create page', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('api-inspector.create'));
    $response->assertOk();
});
