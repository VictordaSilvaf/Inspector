import { motion, useReducedMotion } from 'motion/react';
import { ChartEmptyState } from '@/components/dashboard/chart-card';

type StatusSlice = {
    status: string;
    label: string;
    count: number;
};

const sliceColors: Record<string, string> = {
    success: '#34d399',
    warning: '#f58529',
    error: '#dd2a7b',
};

type Props = {
    data: StatusSlice[];
    delay?: number;
};

export function StatusDonutChart({ data, delay = 0 }: Props) {
    const reduceMotion = useReducedMotion();
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const size = 168;
    const stroke = 22;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    if (total === 0) {
        return (
            <ChartEmptyState message="Sem checks nas últimas 24 horas para montar a distribuição." />
        );
    }

    let offset = 0;

    const segments = data
        .filter((item) => item.count > 0)
        .map((item) => {
            const fraction = item.count / total;
            const dash = fraction * circumference;
            const segment = {
                ...item,
                dash,
                offset,
                color: sliceColors[item.status] ?? '#a89b90',
            };

            offset += dash;

            return segment;
        });

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative shrink-0">
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="-rotate-90"
                    role="img"
                    aria-label="Distribuição de status dos checks"
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        className="text-surface-strong"
                    />
                    {segments.map((segment, index) => (
                        <motion.circle
                            key={segment.status}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                            strokeDashoffset={-segment.offset}
                            initial={
                                reduceMotion
                                    ? false
                                    : { strokeDasharray: `0 ${circumference}` }
                            }
                            animate={{
                                strokeDasharray: `${segment.dash} ${circumference - segment.dash}`,
                            }}
                            transition={{
                                delay: delay + index * 0.12,
                                duration: 0.9,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <motion.p
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + 0.35, duration: 0.45 }}
                        className="text-2xl font-semibold text-ink"
                    >
                        {total}
                    </motion.p>
                    <p className="text-xs text-ink-soft">checks</p>
                </div>
            </div>

            <ul className="grid w-full max-w-xs gap-3 sm:max-w-none">
                {data.map((item, index) => {
                    const percent =
                        total > 0 ? Math.round((item.count / total) * 100) : 0;

                    return (
                        <motion.li
                            key={item.status}
                            initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                delay: delay + 0.2 + index * 0.08,
                                duration: 0.4,
                            }}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor:
                                            sliceColors[item.status] ?? '#a89b90',
                                    }}
                                />
                                <span className="text-ink-muted">{item.label}</span>
                            </div>
                            <span className="shrink-0 font-medium text-ink">
                                {item.count}{' '}
                                <span className="text-ink-soft">({percent}%)</span>
                            </span>
                        </motion.li>
                    );
                })}
            </ul>
        </div>
    );
}
