import type { ReactNode } from 'react';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children }: Props) {
    return (
        <div className="dark relative flex min-h-screen w-full flex-col bg-[#0c0b0a] font-display text-[#f5f0ea] antialiased selection:bg-[#dd2a7b]/35 selection:text-white">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(221,42,123,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(245,133,41,0.12), transparent 50%)',
                }}
            />
            {children}
        </div>
    );
}
