import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type ChartCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    delay?: number;
};

export function ChartCard({
    title,
    description,
    children,
    className,
    delay = 0,
}: ChartCardProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
                'rounded-[1.5rem] border border-hairline bg-surface p-5 sm:p-6',
                className,
            )}
        >
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                {description ? (
                    <p className="mt-1 text-sm text-ink-soft">{description}</p>
                ) : null}
            </div>
            {children}
        </motion.section>
    );
}

export function ChartEmptyState({ message }: { message: string }) {
    return (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-hairline px-4 py-8 text-center text-sm text-ink-muted">
            {message}
        </div>
    );
}
