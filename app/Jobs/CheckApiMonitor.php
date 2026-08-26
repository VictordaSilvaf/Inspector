<?php

namespace App\Jobs;

use App\Models\ApiMonitor;
use App\Services\ApiMonitorChecker;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckApiMonitor implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $monitorId,
        public string $triggeredBy = 'scheduled',
    ) {}

    public function handle(ApiMonitorChecker $checker): void
    {
        $monitor = ApiMonitor::query()->find($this->monitorId);

        if ($monitor === null || ! $monitor->is_active) {
            return;
        }

        $checker->check($monitor, $this->triggeredBy);
    }
}
