import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

function StoryLogo() {
    const reduceMotion = useReducedMotion();

    return (
        <div className="relative size-16">
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        'conic-gradient(from 210deg, #f58529, #dd2a7b, #8134af, #515bd4, #f58529)',
                }}
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={
                    reduceMotion
                        ? undefined
                        : { duration: 16, repeat: Infinity, ease: 'linear' }
                }
            />
            <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-canvas">
                <div className="flex size-full items-center justify-center rounded-full bg-elevated text-sm font-semibold tracking-tight text-ink">
                    In
                </div>
            </div>
        </div>
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-canvas p-6 font-display text-ink antialiased md:p-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: 'var(--auth-glow)' }}
            />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-5">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-3 font-medium"
                        >
                            <StoryLogo />
                            <span className="text-lg font-semibold tracking-tight text-ink">
                                Inspector
                            </span>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold tracking-tight text-ink">
                                {title}
                            </h1>
                            {description ? (
                                <p className="text-center text-sm leading-relaxed text-ink-muted">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-hairline bg-surface p-6 shadow-[0_24px_80px_rgba(12,11,10,0.08)] backdrop-blur-sm dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] [&_a]:text-ink [&_button]:rounded-full [&_input]:rounded-xl [&_label]:text-ink-warm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
