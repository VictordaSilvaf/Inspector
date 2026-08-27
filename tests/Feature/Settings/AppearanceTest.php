<?php

use App\Models\User;

test('appearance settings page is no longer available', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/appearance')
        ->assertNotFound();
});

test('appearance cookie is shared with the view', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->withUnencryptedCookie('appearance', 'light')
        ->get(route('profile.edit'));

    $response->assertOk();
    $response->assertViewHas('appearance', 'light');
});

test('appearance cookie is shared with inertia props', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withUnencryptedCookie('appearance', 'dark')
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('appearance', 'dark'));
});
