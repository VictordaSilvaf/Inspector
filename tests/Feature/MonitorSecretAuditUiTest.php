<?php

use App\Models\ApiMonitor;
use App\Models\ApiMonitorSecretAudit;
use App\Models\User;
use App\Services\Security\MonitorSecretAuditService;

test('authenticated users can view secret audit history for their monitor', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/secure',
        'auth_type' => 'bearer',
        'auth_metadata' => ['configured' => true],
    ]);

    ApiMonitorSecretAudit::query()->create([
        'user_id' => $user->id,
        'api_monitor_id' => $monitor->id,
        'action' => MonitorSecretAuditService::ACTION_SECRET_CREATED,
        'metadata' => ['auth_type' => 'bearer'],
        'ip_address' => '127.0.0.1',
    ]);

    $this->actingAs($user)
        ->get(route('api-inspector.audit.index', $monitor))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ApiInspector/audit')
            ->where('monitor.id', $monitor->id)
            ->has('audits.data', 1)
            ->where('audits.data.0.actionLabel', 'Credencial criada')
            ->where('audits.data.0.actorName', $user->name)
        );

    $this->actingAs($otherUser)
        ->get(route('api-inspector.audit.index', $monitor))
        ->assertForbidden();
});

test('audit history never exposes secret values in metadata', function () {
    $user = User::factory()->create();
    $monitor = ApiMonitor::factory()->for($user)->create([
        'url' => 'https://api.example.com/secure',
        'auth_type' => 'bearer',
        'auth_metadata' => ['configured' => true],
    ]);

    ApiMonitorSecretAudit::query()->create([
        'user_id' => $user->id,
        'api_monitor_id' => $monitor->id,
        'action' => MonitorSecretAuditService::ACTION_SECRET_CREATED,
        'metadata' => ['auth_type' => 'bearer'],
    ]);

    $this->actingAs($user)
        ->get(route('api-inspector.audit.index', $monitor))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('audits.data', 1)
            ->where('audits.data.0.metadata.auth_type', 'bearer')
        );
});
