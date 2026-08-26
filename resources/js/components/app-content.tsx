import type { ComponentProps } from 'react';
import type { AppVariant } from '@/types';

type Props = ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ children, className, ...props }: Props) {
    return (
        <main
            className={
                className ??
                'relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14'
            }
            {...props}
        >
            {children}
        </main>
    );
}
