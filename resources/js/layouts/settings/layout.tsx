import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { edit as editAppearance } from '@/routes/appearance';
import { index as notificationChannelsIndex } from '@/routes/notification-channels';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Perfil',
        href: edit(),
        icon: null,
    },
    {
        title: 'Segurança',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Aparência',
        href: editAppearance(),
        icon: null,
    },
    {
        title: 'Notificações',
        href: notificationChannelsIndex(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div>
            <Heading
                title="Configurações"
                description="Gerencie seu perfil e as configurações da conta"
            />

            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                <aside className="w-full max-w-xl lg:w-52">
                    <nav
                        className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1"
                        aria-label="Configurações"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-sm transition',
                                        active
                                            ? 'bg-white/10 text-white'
                                            : 'text-[#b5a89c] hover:bg-white/5 hover:text-white',
                                    )}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
