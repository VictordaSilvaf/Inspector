<?php

namespace App\Services;

use App\Models\ApiMonitor;
use App\Models\ApiMonitorCheck;
use App\Services\Alerts\MonitorAlertEvaluator;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

class ApiMonitorChecker
{
    private const int SlowResponseThresholdMs = 500;

    private const int BodyPreviewLimit = 500;

    public function __construct(
        private MonitorAlertEvaluator $alertEvaluator,
    ) {}

    public function check(ApiMonitor $monitor, string $triggeredBy = 'manual'): ApiMonitorCheck
    {
        $startedAt = hrtime(true);

        try {
            $pendingRequest = Http::timeout($monitor->timeout_seconds ?? 10)
                ->withHeaders($this->buildHeaders($monitor));

            $response = match (strtoupper($monitor->http_method)) {
                'POST' => $pendingRequest->post($monitor->url),
                'PUT' => $pendingRequest->put($monitor->url),
                'DELETE' => $pendingRequest->delete($monitor->url),
                default => $pendingRequest->get($monitor->url),
            };

            $responseTimeMs = (int) round((hrtime(true) - $startedAt) / 1_000_000);
            $body = $response->body();

            $status = $this->resolveStatus(
                $response->successful(),
                $response->status(),
                $monitor->expected_status_code,
                $responseTimeMs,
            );

            $errorMessage = $status === 'error'
                ? $this->resolveErrorMessage($response->status(), $monitor->expected_status_code)
                : null;

            $check = $this->recordCheck($monitor, [
                'status' => $status,
                'http_status_code' => $response->status(),
                'response_time_ms' => $responseTimeMs,
                'error_message' => $errorMessage,
                'response_size_bytes' => strlen($body),
                'response_body_preview' => $this->previewBody($body),
                'triggered_by' => $triggeredBy,
            ]);

            $this->syncMonitorSummary($monitor, $check);
            $this->evaluateAlerts($monitor, $check);

            return $check;
        } catch (ConnectionException $exception) {
            $check = $this->recordFailure($monitor, $triggeredBy, $exception->getMessage());
            $this->evaluateAlerts($monitor, $check);

            return $check;
        } catch (Throwable $exception) {
            $check = $this->recordFailure($monitor, $triggeredBy, 'Não foi possível consultar o endereço da API.');
            $this->evaluateAlerts($monitor, $check);

            return $check;
        }
    }

    /**
     * @return array<string, string>
     */
    private function buildHeaders(ApiMonitor $monitor): array
    {
        $headers = [];

        if ($monitor->auth_type === 'basic' && is_array($monitor->auth_config)) {
            $username = $monitor->auth_config['username'] ?? '';
            $password = $monitor->auth_config['password'] ?? '';
            $headers['Authorization'] = 'Basic '.base64_encode("{$username}:{$password}");
        }

        if ($monitor->auth_type === 'bearer' && is_array($monitor->auth_config)) {
            $headers['Authorization'] = 'Bearer '.($monitor->auth_config['token'] ?? '');
        }

        if ($monitor->auth_type === 'api_key' && is_array($monitor->auth_config)) {
            $headerName = $monitor->auth_config['header_name'] ?? 'X-API-Key';
            $headers[$headerName] = $monitor->auth_config['api_key'] ?? '';
        }

        foreach ($monitor->custom_headers ?? [] as $header) {
            if (! empty($header['key'])) {
                $headers[$header['key']] = $header['value'] ?? '';
            }
        }

        return $headers;
    }

    private function resolveStatus(
        bool $successful,
        int $httpStatusCode,
        int $expectedStatusCode,
        int $responseTimeMs,
    ): string {
        if (! $successful || $httpStatusCode !== $expectedStatusCode) {
            return 'error';
        }

        if ($responseTimeMs >= self::SlowResponseThresholdMs) {
            return 'warning';
        }

        return 'success';
    }

    private function resolveErrorMessage(int $httpStatusCode, int $expectedStatusCode): string
    {
        if ($httpStatusCode === 401) {
            return 'Credenciais inválidas, verifique as credenciais e tente novamente.';
        }

        if ($httpStatusCode === 404) {
            return 'API não encontrada';
        }

        if ($httpStatusCode !== $expectedStatusCode) {
            return "A API respondeu com status {$httpStatusCode}. Esperado {$expectedStatusCode}.";
        }

        return 'A API respondeu com erro.';
    }

    private function previewBody(string $body): ?string
    {
        if ($body === '') {
            return null;
        }

        return mb_substr($body, 0, self::BodyPreviewLimit);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function recordCheck(ApiMonitor $monitor, array $attributes): ApiMonitorCheck
    {
        return $monitor->checks()->create([
            ...$attributes,
            'checked_at' => now(),
        ]);
    }

    private function recordFailure(
        ApiMonitor $monitor,
        string $triggeredBy,
        string $errorMessage,
    ): ApiMonitorCheck {
        $check = $this->recordCheck($monitor, [
            'status' => 'error',
            'http_status_code' => null,
            'response_time_ms' => null,
            'error_message' => $errorMessage,
            'response_size_bytes' => null,
            'response_body_preview' => null,
            'triggered_by' => $triggeredBy,
        ]);

        $this->syncMonitorSummary($monitor, $check);

        return $check;
    }

    private function syncMonitorSummary(ApiMonitor $monitor, ApiMonitorCheck $check): void
    {
        $consecutiveFailures = $check->status === 'error'
            ? $monitor->consecutive_failures + 1
            : 0;

        $monitor->update([
            'last_status' => $check->status,
            'last_response_time_ms' => $check->response_time_ms,
            'last_checked_at' => $check->checked_at,
            'consecutive_failures' => $consecutiveFailures,
        ]);
    }

    private function evaluateAlerts(ApiMonitor $monitor, ApiMonitorCheck $check): void
    {
        try {
            $this->alertEvaluator->evaluate($monitor->fresh() ?? $monitor, $check);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
