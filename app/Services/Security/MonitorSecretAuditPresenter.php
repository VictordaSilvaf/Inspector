<?php

namespace App\Services\Security;

use App\Models\ApiMonitorSecretAudit;

final class MonitorSecretAuditPresenter
{
    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(ApiMonitorSecretAudit $audit): array
    {
        return [
            'id' => $audit->id,
            'action' => $audit->action,
            'actionLabel' => $this->actionLabel($audit->action),
            'metadata' => $this->sanitizeMetadata($audit->metadata ?? []),
            'actorName' => $audit->user?->name,
            'actorEmail' => $audit->user?->email,
            'ipAddress' => $audit->ip_address,
            'createdAt' => $audit->created_at?->toIso8601String(),
        ];
    }

    public function actionLabel(string $action): string
    {
        return match ($action) {
            MonitorSecretAuditService::ACTION_SECRET_CREATED => 'Credencial criada',
            MonitorSecretAuditService::ACTION_SECRET_ROTATED => 'Credencial alterada',
            MonitorSecretAuditService::ACTION_SECRET_DELETED => 'Credencial removida',
            MonitorSecretAuditService::ACTION_AUTH_TYPE_CHANGED => 'Tipo de autenticação alterado',
            MonitorSecretAuditService::ACTION_URL_BLOCKED => 'URL bloqueada',
            default => $action,
        };
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>|null
     */
    private function sanitizeMetadata(array $metadata): ?array
    {
        if ($metadata === []) {
            return null;
        }

        $safe = [];

        foreach ($metadata as $key => $value) {
            if (is_string($value) || is_int($value) || is_bool($value)) {
                $safe[$key] = $value;

                continue;
            }

            if (is_array($value)) {
                $safe[$key] = $this->sanitizeMetadata($value);
            }
        }

        return $safe === [] ? null : $safe;
    }
}
