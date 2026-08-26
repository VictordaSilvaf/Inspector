<?php

namespace App\Console\Commands;

use App\Models\ApiMonitor;
use App\Services\ApiMonitorChecker;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('api-monitors:check')]
#[Description('Run health checks for API monitors that are due.')]
class CheckDueApiMonitors extends Command
{
    public function handle(ApiMonitorChecker $checker): int
    {
        $checkedCount = 0;

        ApiMonitor::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->chunkById(50, function ($monitors) use ($checker, &$checkedCount): void {
                foreach ($monitors as $monitor) {
                    if (! $monitor->isDueForCheck()) {
                        continue;
                    }

                    $checker->check($monitor, 'scheduled');
                    $checkedCount++;
                }
            });

        $this->components->info("Checked {$checkedCount} API monitor(s).");

        return self::SUCCESS;
    }
}
