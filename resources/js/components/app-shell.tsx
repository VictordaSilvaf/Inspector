import type { ReactNode } from 'react';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children }: Props) {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-canvas font-display text-ink antialiased selection:bg-brand/35 selection:text-white">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0"
                style={{ background: 'var(--shell-glow)' }}
            />
            {children}
        </div>
    );
}
