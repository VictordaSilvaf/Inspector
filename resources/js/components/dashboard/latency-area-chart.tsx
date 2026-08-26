import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { ChartEmptyState } from '@/components/dashboard/chart-card';

type LatencyPoint = {
    label: string;
    averageMs: number | null;
    checks: number;
};

type Props = {
    data: LatencyPoint[];
    delay?: number;
};

const width = 640;
const height = 220;
const padding = { top: 16, right: 12, bottom: 28, left: 40 };

function buildPath(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
}

function buildAreaPath(
    points: Array<{ x: number; y: number }>,
    baseline: number,
): string {
    if (points.length === 0) {
        return '';
    }

    const line = buildPath(points);
    const last = points[points.length - 1];
    const first = points[0];

    return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

export function LatencyAreaChart({ data, delay = 0 }: Props) {
    const reduceMotion = useReducedMotion();

    const plotted = useMemo(() => {
        const values = data
            .map((point) => point.averageMs)
            .filter((value): value is number => value !== null);

        if (values.length === 0) {
            return null;
        }

        const maxMs = Math.max(...values, 100);
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;
        const step = data.length > 1 ? innerWidth / (data.length - 1) : 0;

        const points = data.map((point, index) => {
            const ms = point.averageMs ?? 0;
            const x = padding.left + index * step;
            const y =
                padding.top +
                innerHeight -
                (ms / maxMs) * innerHeight;

            return { ...point, x, y, ms };
        });

        return {
            maxMs,
            points,
            linePath: buildPath(points),
            areaPath: buildAreaPath(points, padding.top + innerHeight),
        };
    }, [data]);

    if (! plotted) {
        return (
            <ChartEmptyState message="Ainda não há latência registrada nas últimas 24 horas." />
        );
    }

    const labelIndexes = [0, 5, 11, 17, 23].filter(
        (index) => index < data.length,
    );

    return (
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="min-w-[640px] w-full"
                role="img"
                aria-label="Tendência de latência média por hora"
            >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y =
                        padding.top +
                        (height - padding.top - padding.bottom) * ratio;

                    return (
                        <line
                            key={ratio}
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                            className="stroke-hairline"
                            strokeWidth={1}
                        />
                    );
                })}

                <motion.path
                    d={plotted.areaPath}
                    fill="url(#latencyGradient)"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay, duration: 0.6 }}
                />

                <motion.path
                    d={plotted.linePath}
                    fill="none"
                    stroke="#dd2a7b"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={
                        reduceMotion
                            ? false
                            : { pathLength: 0, opacity: 0.4 }
                    }
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        delay: delay + 0.15,
                        duration: 1.1,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                />

                {plotted.points.map((point, index) =>
                    point.averageMs !== null ? (
                        <motion.circle
                            key={`${point.label}-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r={3.5}
                            fill="#f58529"
                            initial={reduceMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                delay: delay + 0.25 + index * 0.02,
                                duration: 0.35,
                            }}
                        />
                    ) : null,
                )}

                {labelIndexes.map((index) => (
                    <text
                        key={data[index].label}
                        x={plotted.points[index]?.x ?? padding.left}
                        y={height - 8}
                        textAnchor="middle"
                        className="fill-ink-soft text-[10px]"
                    >
                        {data[index].label}
                    </text>
                ))}

                <text
                    x={8}
                    y={padding.top + 4}
                    className="fill-ink-soft text-[10px]"
                >
                    {plotted.maxMs}ms
                </text>

                <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dd2a7b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#dd2a7b" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
