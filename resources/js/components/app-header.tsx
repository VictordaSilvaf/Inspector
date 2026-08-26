import { Link, router } from '@inertiajs/react';
import { index as apiInspectorIndex } from '@/routes/api-inspector';
import { index as webhookInspectorIndex } from '@/routes/webhook-inspector';
import { edit as editProfile } from '@/routes/profile';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const navLinkClass =
    'rounded-full px-3 py-1.5 text-sm transition hover:bg-white/5 hover:text-white';

export function AppHeader({ breadcrumbs = [] }: Readonly<Props>) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <>
            <header className="relative z-20 border-b border-white/5">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                    <Link
                        href={dashboard()}
                        prefetch
                        className="text-lg font-semibold tracking-tight text-white"
                    >
                        Inspector
                    </Link>

                    <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                        <Link
                            href={dashboard()}
                            prefetch
                            className={cn(
                                navLinkClass,
                                isCurrentOrParentUrl(dashboard())
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#b5a89c]',
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
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#b5a89c]',
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
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#b5a89c]',
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
                                    ? 'bg-white/10 text-white'
                                    : 'text-[#b5a89c]',
                            )}
                        >
                            Conta
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post(logout())}
                            className={cn(navLinkClass, 'text-[#b5a89c]')}
                        >
                            Sair
                        </button>
                    </nav>
                </div>
            </header>

            {breadcrumbs.length > 1 ? (
                <div className="relative z-20 border-b border-white/5">
                    <div className="mx-auto flex h-11 w-full max-w-6xl items-center px-5 text-[#a89b90] sm:px-8 [&_a]:text-[#b5a89c] [&_a:hover]:text-white [&_span]:text-[#f5f0ea]">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            ) : null}
        </>
    );
}
