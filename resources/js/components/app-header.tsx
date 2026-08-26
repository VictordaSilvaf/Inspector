import { Link, router } from '@inertiajs/react';
import { index as apiInspectorIndex } from '@/routes/api-inspector';
import { index as webhookInspectorIndex } from '@/routes/webhook-inspector';
import { edit as editProfile } from '@/routes/profile';
import AppearanceToggle from '@/components/appearance-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const navLinkClass =
    'rounded-full px-3 py-1.5 text-sm transition hover:bg-surface-strong hover:text-ink';

export function AppHeader({ breadcrumbs = [] }: Readonly<Props>) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <>
            <header className="relative z-20 border-b border-hairline">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                    <Link
                        href={dashboard()}
                        prefetch
                        className="text-lg font-semibold tracking-tight text-ink"
                    >
                        Inspector
                    </Link>

                    <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                        <AppearanceToggle />
                        <Link
                            href={dashboard()}
                            prefetch
                            className={cn(
                                navLinkClass,
                                isCurrentOrParentUrl(dashboard())
                                    ? 'bg-surface-strong text-ink'
                                    : 'text-ink-muted',
                            )}
                        >
                            Painel
                        </Link>
                        <Link
                            href={apiInspectorIndex()}
                            prefetch
                            className={cn(
                                navLinkClass,
                                isCurrentOrParentUrl(apiInspectorIndex())
                                    ? 'bg-surface-strong text-ink'
                                    : 'text-ink-muted',
                            )}
                        >
                            APIs
                        </Link>
                        <Link
                            href={webhookInspectorIndex()}
                            prefetch
                            className={cn(
                                navLinkClass,
                                isCurrentOrParentUrl(webhookInspectorIndex())
                                    ? 'bg-surface-strong text-ink'
                                    : 'text-ink-muted',
                            )}
                        >
                            Webhooks
                        </Link>
                        <Link
                            href={editProfile()}
                            prefetch
                            className={cn(
                                navLinkClass,
                                isCurrentOrParentUrl('/settings')
                                    ? 'bg-surface-strong text-ink'
                                    : 'text-ink-muted',
                            )}
                        >
                            Conta
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post(logout())}
                            className={cn(navLinkClass, 'text-ink-muted')}
                        >
                            Sair
                        </button>
                    </nav>
                </div>
            </header>

            {breadcrumbs.length > 1 ? (
                <div className="relative z-20 border-b border-hairline">
                    <div className="mx-auto flex h-11 w-full max-w-6xl items-center px-5 text-ink-soft sm:px-8 [&_a]:text-ink-muted [&_a:hover]:text-ink [&_span]:text-ink">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            ) : null}
        </>
    );
}
