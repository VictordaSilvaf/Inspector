import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { show as apiInspectorShow } from '@/routes/api-inspector';
import { ChartEmptyState } from '@/components/dashboard/chart-card';

type MonitorLatencyItem = {
    id: number;
    name: string;
    averageMs: number;
    status: string | null;
};

type Props = {
    data: MonitorLatencyItem[];
    delay?: number;
};

const statusColors: Record<string, string> = {
    success: '#34d399',
    warning: '#f58529',
    error: '#dd2a7b',
};

export function MonitorLatencyChart({ data, delay = 0 }: Props) {
    const reduceMotion = useReducedMotion();

    if (data.length === 0) {
        return (
            <ChartEmptyState message="Cadastre monitores e aguarde checks para comparar latência média." />
        );
    }

    const maxMs = Math.max(...data.map((item) => item.averageMs), 100);

    return (
        <ul className="space-y-4">
            {data.map((item, index) => {
                const widthPercent = (item.averageMs / maxMs) * 100;
                const color = statusColors[item.status ?? ''] ?? '#8134af';

                return (
                    <motion.li
                        key={item.id}
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            delay: delay + index * 0.08,
                            duration: 0.45,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        <Link
                            href={apiInspectorShow(item.id)}
                            className="group block rounded-2xl bg-surface-strong/40 p-3 transition hover:bg-surface-strong"
                        >
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-medium text-ink group-hover:text-ink">
                                    {item.name}
                                </p>
                                <span className="shrink-0 text-sm font-semibold text-ink">
                                    {item.averageMs}ms
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-strong">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${color}, #515bd4)`,
                                    }}
                                    initial={
                                        reduceMotion ? false : { width: 0 }
                                    }
                                    animate={{ width: `${widthPercent}%` }}
                                    transition={{
                                        delay: delay + 0.15 + index * 0.08,
                                        duration: 0.75,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                />
                            </div>
                        </Link>
                    </motion.li>
                );
            })}
        </ul>
    );
}
