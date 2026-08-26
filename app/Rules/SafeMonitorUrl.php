<?php

namespace App\Rules;

use App\Exceptions\InvalidMonitorUrlException;
use App\Services\Security\MonitorUrlGuard;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class SafeMonitorUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        try {
            app(MonitorUrlGuard::class)->assertSafe($value);
        } catch (InvalidMonitorUrlException $exception) {
            $fail($exception->getMessage());
        }
    }
}
