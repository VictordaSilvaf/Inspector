import { motion, useReducedMotion } from 'motion/react';
import { ChartEmptyState } from '@/components/dashboard/chart-card';

type AvailabilityPoint = {
    label: string;
    success: number;
    warning: number;
    error: number;
};

type Props = {
    data: AvailabilityPoint[];
    delay?: number;
};

const width = 640;
const height = 220;
const padding = { top: 16, right: 12, bottom: 28, left: 12 };
const barGap = 3;

export function AvailabilityBarChart({ data, delay = 0 }: Props) {
    const reduceMotion = useReducedMotion();
    const totalChecks = data.reduce(
        (sum, point) => sum + point.success + point.warning + point.error,
        0,
    );

    if (totalChecks === 0) {
        return (
            <ChartEmptyState message="Nenhum check registrado por hora nas últimas 24 horas." />
        );
    }

    const maxTotal = Math.max(
        ...data.map((point) => point.success + point.warning + point.error),
        1,
    );
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const barWidth = innerWidth / data.length - barGap;
    const labelIndexes = [0, 5, 11, 17, 23].filter(
        (index) => index < data.length,
    );

    return (
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="min-w-[640px] w-full"
                role="img"
                aria-label="Checks por hora separados por status"
            >
                {data.map((point, index) => {
                    const x = padding.left + index * (barWidth + barGap);
                    const total = point.success + point.warning + point.error;
                    const scale = total / maxTotal;
                    const barHeight = scale * innerHeight;
                    const y = padding.top + innerHeight - barHeight;

                    const successHeight =
                        total > 0
                            ? (point.success / total) * barHeight
                            : 0;
                    const warningHeight =
                        total > 0
                            ? (point.warning / total) * barHeight
                            : 0;
                    const errorHeight =
                        total > 0
                            ? (point.error / total) * barHeight
                            : 0;

                    return (
                        <g key={`${point.label}-${index}`}>
                            {total > 0 ? (
                                <>
                                    <motion.rect
                                        x={x}
                                        y={y + barHeight - successHeight}
                                        width={barWidth}
                                        height={successHeight}
                                        rx={2}
                                        fill="#34d399"
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { scaleY: 0, originY: 1 }
                                        }
                                        animate={{ scaleY: 1 }}
                                        transition={{
                                            delay: delay + index * 0.015,
                                            duration: 0.45,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                                    />
                                    <motion.rect
                                        x={x}
                                        y={
                                            y +
                                            barHeight -
                                            successHeight -
                                            warningHeight
                                        }
                                        width={barWidth}
                                        height={warningHeight}
                                        rx={2}
                                        fill="#f58529"
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { scaleY: 0, originY: 1 }
                                        }
                                        animate={{ scaleY: 1 }}
                                        transition={{
                                            delay: delay + 0.05 + index * 0.015,
                                            duration: 0.45,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                                    />
                                    <motion.rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={errorHeight}
                                        rx={2}
                                        fill="#dd2a7b"
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { scaleY: 0, originY: 1 }
                                        }
                                        animate={{ scaleY: 1 }}
                                        transition={{
                                            delay: delay + 0.1 + index * 0.015,
                                            duration: 0.45,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                        style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                                    />
                                </>
                            ) : null}
                        </g>
                    );
                })}

                {labelIndexes.map((index) => {
                    const x =
                        padding.left +
                        index * (barWidth + barGap) +
                        barWidth / 2;

                    return (
                        <text
                            key={data[index].label}
                            x={x}
                            y={height - 8}
                            textAnchor="middle"
                            className="fill-ink-soft text-[10px]"
                        >
                            {data[index].label}
                        </text>
                    );
                })}
            </svg>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Sucesso
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-brand-warm" />
                    Alerta
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-brand" />
                    Erro
                </span>
            </div>
        </div>
    );
}
