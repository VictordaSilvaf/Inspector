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
            <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-[#0c0b0a]">
                <div className="flex size-full items-center justify-center rounded-full bg-[#161412] text-sm font-semibold tracking-tight text-[#f5f0ea]">
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
        <div className="dark relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#0c0b0a] p-6 font-display text-[#f5f0ea] antialiased md:p-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(221,42,123,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 40%, rgba(245,133,41,0.18), transparent 50%), linear-gradient(180deg, #120f0d 0%, #0c0b0a 55%, #0c0b0a 100%)',
                }}
            />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-5">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-3 font-medium"
                        >
                            <StoryLogo />
                            <span className="text-lg font-semibold tracking-tight text-white">
                                Inspector
                            </span>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold tracking-tight text-white">
                                {title}
                            </h1>
                            {description ? (
                                <p className="text-center text-sm leading-relaxed text-[#b5a89c]">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm [&_a]:text-[#f5f0ea] [&_button]:rounded-full [&_input]:rounded-xl [&_label]:text-[#f3ebe3]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
