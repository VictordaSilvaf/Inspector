import { Moon, Sun } from 'lucide-react';
import { useEffect, useState, type HTMLAttributes } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type Props = HTMLAttributes<HTMLButtonElement>;

export default function AppearanceToggle({ className, ...props }: Props) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className={cn(
                'inline-flex size-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-strong hover:text-ink',
                className,
            )}
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={isDark ? 'Tema claro' : 'Tema escuro'}
            suppressHydrationWarning
            {...props}
        >
            {isDark ? (
                <Sun className="size-4" aria-hidden />
            ) : (
                <Moon className="size-4" aria-hidden />
            )}
        </button>
    );
}
