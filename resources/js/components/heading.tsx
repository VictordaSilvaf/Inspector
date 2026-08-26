export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-1'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base font-medium text-ink'
                        : 'text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-ink'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm leading-relaxed text-ink-muted">
                    {description}
                </p>
            )}
        </header>
    );
}
