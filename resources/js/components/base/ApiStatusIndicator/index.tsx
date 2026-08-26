import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const API_STATUS_INDICATOR_STATUSES = [
    'success',
    'error',
    'warning',
    'info',
] as const;

type ApiStatusIndicatorStatus =
    (typeof API_STATUS_INDICATOR_STATUSES)[number];

type StatusStyle = {
    labelClassName: string;
    dotClassName: string;
};

const statusStyles: Record<ApiStatusIndicatorStatus, StatusStyle> = {
    success: {
        labelClassName: 'text-green-500',
        dotClassName: 'bg-green-500',
    },
    error: {
        labelClassName: 'text-red-500',
        dotClassName: 'bg-red-500',
    },
    warning: {
        labelClassName: 'text-yellow-500',
        dotClassName: 'bg-yellow-500',
    },
    info: {
        labelClassName: 'text-blue-500',
        dotClassName: 'bg-blue-500',
    },
};

type ApiStatusIndicatorProps = {
    time: number;
    status?: ApiStatusIndicatorStatus;
    className?: string;
    showTime?: boolean;
    variants?: Variants;
};

function StatusDot({ className }: Readonly<{ className: string }>) {
    return (
        <div className="relative size-4 shrink-0">
            <div className={cn('size-4 rounded-full', className)} />
            <div
                className={cn(
                    'absolute inset-0 size-4 rounded-full animate-ping',
                    className,
                )}
            />
        </div>
    );
}

function ApiStatusIndicator({
    time,
    status = 'success',
    className,
    showTime = true,
    variants,
}: Readonly<ApiStatusIndicatorProps>) {
    const { labelClassName, dotClassName } = statusStyles[status];

    return (
        <motion.div
            variants={variants}
            initial={variants === undefined ? { opacity: 0, x: '80%' } : undefined}
            animate={variants === undefined ? { opacity: 1, x: 0 } : undefined}
            transition={
                variants === undefined
                    ? { duration: 0.2, ease: 'easeInOut' }
                    : undefined
            }
            className={cn(
                'absolute top-0 right-0 flex items-center gap-3 rounded-bl-lg bg-background px-3 py-1 shadow',
                'border-b-2 border-l-2 border-border',
                className,
            )}
        >
            {showTime && (
                <motion.p
                    key={`${status}-${time}`}
                    initial={{ opacity: 0.6, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn('text-sm font-bold pb-1', labelClassName)}
                >
                    {time}ms
                </motion.p>
            )}
            <motion.div
                key={status}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <StatusDot className={dotClassName} />
            </motion.div>
        </motion.div>
    );
}

export {
    API_STATUS_INDICATOR_STATUSES,
    ApiStatusIndicator,
    type ApiStatusIndicatorStatus,
};
export default ApiStatusIndicator;
