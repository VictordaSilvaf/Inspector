<?php

namespace App\Console\Commands;

use App\Jobs\CheckApiMonitor;
use App\Models\ApiMonitor;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('api-monitors:check')]
#[Description('Run health checks for API monitors that are due.')]
class CheckDueApiMonitors extends Command
{
    public function handle(): int
    {
        $checkedCount = 0;

        ApiMonitor::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->chunkById(50, function ($monitors) use (&$checkedCount): void {
                foreach ($monitors as $monitor) {
                    if (! $monitor->isDueForCheck()) {
                        continue;
                    }

                    CheckApiMonitor::dispatch($monitor->id, 'scheduled');
                    $checkedCount++;
                }
            });

        $this->components->info("Checked {$checkedCount} API monitor(s).");

        return self::SUCCESS;
    }
}
