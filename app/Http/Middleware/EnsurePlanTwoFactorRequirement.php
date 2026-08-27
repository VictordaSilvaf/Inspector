<?php

namespace App\Http\Middleware;

use App\Services\Billing\PlanLimitsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanTwoFactorRequirement
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $limits = app(PlanLimitsService::class)->forUser($user);

        if (! $limits->requiresTwoFactor) {
            return $next($request);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return $next($request);
        }

        if ($request->routeIs('security.*', 'two-factor.*', 'logout', 'profile.*')) {
            return $next($request);
        }

        if ($request->header('X-Inertia')) {
            return redirect()
                ->route('security.edit')
                ->with('error', 'Ative a autenticação em dois fatores para continuar usando o plano Business.');
        }

        return redirect()
            ->route('security.edit')
            ->with('error', 'Ative a autenticação em dois fatores para continuar usando o plano Business.');
    }
}
