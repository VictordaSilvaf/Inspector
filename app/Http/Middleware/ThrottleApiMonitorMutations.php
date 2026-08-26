<?php

namespace App\Http\Middleware;

use App\Services\Security\MonitorSecurityAlertService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleApiMonitorMutations
{
    public function handle(Request $request, Closure $next, string $action = 'store'): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $limit = (int) config("monitors.rate_limit.{$action}", 10);
        $key = "monitor-{$action}:{$user->id}";

        if (RateLimiter::tooManyAttempts($key, $limit)) {
            app(MonitorSecurityAlertService::class)->record(
                $user,
                MonitorSecurityAlertService::EVENT_RATE_LIMIT,
            );

            $seconds = RateLimiter::availableIn($key);

            return redirect()->back()->withErrors([
                'rate_limit' => "Muitas tentativas. Tente novamente em {$seconds} segundos.",
            ]);
        }

        RateLimiter::hit($key, 60);

        $response = $next($request);

        if ($response->getStatusCode() >= 400) {
            RateLimiter::clear($key);
        }

        return $response;
    }
}
