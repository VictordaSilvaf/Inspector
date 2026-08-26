import { motion } from 'motion/react';
import {
    API_MONITOR_INTERVAL_LABELS,
    API_MONITOR_INTERVAL_SECONDS,
} from '@/components/base/ApiConsulting/auth';
import type { ApiMonitorIntervalSeconds } from '@/components/base/ApiConsulting/auth';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type MonitorIntervalSectionProps = {
    intervalSeconds: ApiMonitorIntervalSeconds;
    intervalError?: string | null;
    isLoading: boolean;
    onIntervalChange: (value: ApiMonitorIntervalSeconds) => void;
};

function MonitorIntervalSection({
    intervalSeconds,
    intervalError,
    isLoading,
    onIntervalChange,
}: Readonly<MonitorIntervalSectionProps>) {
    return (
        <motion.div
            className="content-box"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-6">
                <p className="text-xl font-medium">Intervalo de verificação</p>
                <p className="text-sm text-muted-foreground">
                    Escolha de quanto em quanto tempo a API será consultada
                    automaticamente.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="api-monitor-interval">Frequência</Label>
                <Select
                    value={String(intervalSeconds)}
                    onValueChange={(value) =>
                        onIntervalChange(Number(value) as ApiMonitorIntervalSeconds)
                    }
                    disabled={isLoading}
                >
                    <SelectTrigger
                        id="api-monitor-interval"
                        className="w-full sm:w-72"
                        aria-invalid={intervalError !== null && intervalError !== undefined}
                    >
                        <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                        {API_MONITOR_INTERVAL_SECONDS.map((interval) => (
                            <SelectItem key={interval} value={String(interval)}>
                                {API_MONITOR_INTERVAL_LABELS[interval]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={intervalError ?? undefined} />
            </div>
        </motion.div>
    );
}

export { MonitorIntervalSection };
