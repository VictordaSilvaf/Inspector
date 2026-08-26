import { Link, usePage } from '@inertiajs/react';
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import AppearanceToggle from '@/components/appearance-toggle';
import SeoHead from '@/components/seo-head';
import { dashboard, login, register } from '@/routes';
import type { SharedSeo } from '@/types/seo';

const storyItems = [
    { label: 'APIs', value: 'várias' },
    { label: 'Webhooks', value: 'ao vivo' },
    { label: 'Alertas', value: 'custom' },
    { label: 'Auth', value: 'segura' },
];

const apiChecks = [
    { name: 'checkout-api', detail: 'GET · a cada 30s', ms: 128, ok: true },
    { name: 'auth-service', detail: 'Bearer · a cada 10s', ms: 86, ok: true },
    { name: 'billing-webhook', detail: 'Webhook · latência alta', ms: 942, ok: false },
    { name: 'inventory-api', detail: 'API Key · a cada 60s', ms: 201, ok: true },
];

const authMethods = [
    {
        name: 'Basic Auth',
        body: 'Usuário e senha no padrão HTTP Basic — ideal para APIs internas e painéis legados.',
    },
    {
        name: 'Bearer Token',
        body: 'Envie JWT ou access token no header Authorization. O Inspector renova a checagem sem você abrir o Postman.',
    },
    {
        name: 'API Key',
        body: 'Chave em header customizável (ex.: X-API-Key). Você define o nome do header e o valor secreto.',
    },
    {
        name: 'Headers extras',
        body: 'Adicione pares chave/valor livres para tenants, versões de API ou assinaturas específicas do seu stack.',
    },
];

const alertRules = [
    {
        title: 'Queda de status',
        body: 'Dispare quando a API sair do 2xx/3xx — ou quando falhar N vezes seguidas, para filtrar ruído pontual.',
    },
    {
        title: 'Latência acima do limite',
        body: 'Defina um teto em milissegundos. Se a resposta passar disso, o alerta sobe antes do cliente sentir.',
    },
    {
        title: 'Recuperação',
        body: 'Além da queda, avise quando voltar ao normal — para fechar o incidente com o time alinhado.',
    },
    {
        title: 'Canais verificados',
        body: 'E-mails e canais passam por verificação. Você escolhe quem recebe cada tipo de alerta por monitor.',
    },
];

function FadeIn({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
                delay,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            {children}
        </motion.div>
    );
}

function StoryRing({
    children,
    delay = 0,
}: {
    children: ReactNode;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <div className="relative size-[4.75rem] shrink-0 sm:size-24">
            <motion.div
                className="absolute inset-0 rounded-full p-[3px]"
                style={{
                    background:
                        'conic-gradient(from 210deg, #f58529, #dd2a7b, #8134af, #515bd4, #f58529)',
                }}
                animate={reduceMotion ? undefined : { rotate: 360 }}
                transition={
                    reduceMotion
                        ? undefined
                        : {
                              duration: 14,
                              repeat: Infinity,
                              ease: 'linear',
                              delay,
                          }
                }
            />
            <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-canvas p-[3px]">
                <div className="flex size-full items-center justify-center rounded-full bg-elevated text-center text-[0.65rem] font-semibold leading-tight text-ink sm:text-xs">
                    <span className="px-1">{children}</span>
                </div>
            </div>
        </div>
    );
}

function LiveMs({ value }: { value: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(() => Math.round(count.get()));
    const label = useMotionTemplate`${rounded}ms`;
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) {
            count.set(value);

            return;
        }

        const controls = animate(count, value, {
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1],
        });

        return () => controls.stop();
    }, [count, reduceMotion, value]);

    return <motion.span>{label}</motion.span>;
}

function PhoneStage() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className="relative mx-auto w-full max-w-[340px]"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 rounded-[40%] opacity-70 blur-3xl"
                style={{
                    background:
                        'radial-gradient(circle at 50% 30%, rgba(221,42,123,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(245,133,41,0.28), transparent 50%)',
                }}
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-hairline bg-elevated shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div>
                        <p className="font-display text-sm font-semibold tracking-tight text-ink">
                            Seus monitores
                        </p>
                        <p className="text-[0.7rem] text-ink-soft">
                            4 ativos · checagem contínua
                        </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-300">
                        ao vivo
                    </span>
                </div>
                <div className="space-y-2.5 px-5 pb-6">
                    {apiChecks.map((row, index) => (
                        <motion.div
                            key={row.name}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-3.5 py-3"
                            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                            whileInView={
                                reduceMotion ? undefined : { opacity: 1, x: 0 }
                            }
                            viewport={{ once: true }}
                            transition={{
                                delay: 0.12 + index * 0.07,
                                duration: 0.45,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink-warm">
                                    {row.name}
                                </p>
                                <p className="truncate text-xs text-ink-soft">
                                    {row.detail}
                                </p>
                            </div>
                            <p
                                className={
                                    row.ok
                                        ? 'shrink-0 font-display text-sm font-semibold text-emerald-300'
                                        : 'shrink-0 font-display text-sm font-semibold text-brand-warm'
                                }
                            >
                                <LiveMs value={row.ms} />
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function SectionNav() {
    const links = [
        { href: '#apis', label: 'APIs' },
        { href: '#webhooks', label: 'Webhooks' },
        { href: '#alertas', label: 'Alertas' },
        { href: '#conexao', label: 'Conexão' },
        { href: '#seguranca', label: 'Segurança' },
    ];

    return (
        <nav
            aria-label="Seções da página"
            className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-md"
        >
            <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-2.5 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {links.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface-strong hover:text-ink"
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </nav>
    );
}

export default function Welcome() {
    const { auth, seo } = usePage<{ auth: { user: unknown }; seo: SharedSeo }>().props;
    const reduceMotion = useReducedMotion();
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    const heroY = useTransform(
        scrollYProgress,
        [0, 1],
        [0, reduceMotion ? 0 : 80],
    );
    const heroOpacity = useTransform(
        scrollYProgress,
        [0, 0.85],
        [1, reduceMotion ? 1 : 0.35],
    );

    const primaryCta = auth.user ? dashboard() : register();
    const primaryLabel = auth.user ? 'Abrir painel' : 'Criar conta grátis';

    return (
        <>
            <SeoHead
                title="Monitore APIs, webhooks e alertas"
                description="Monitore a saúde das suas APIs HTTP, acompanhe latência em tempo real e receba alertas por e-mail quando algo sair do esperado."
                robots="index, follow"
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: seo.siteName,
                        url: seo.url,
                        description: seo.defaultDescription,
                        inLanguage: seo.locale,
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: seo.siteName,
                        applicationCategory: 'DeveloperApplication',
                        operatingSystem: 'Web',
                        url: seo.url,
                        description: seo.defaultDescription,
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'BRL',
                        },
                    },
                ]}
            />

            <div className="min-h-screen bg-canvas font-display text-ink antialiased selection:bg-brand/35 selection:text-white">
                <a
                    href="#conteudo"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
                >
                    Ir para o conteúdo
                </a>

                <header className="absolute inset-x-0 top-0 z-40">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
                        <p className="text-lg font-semibold tracking-tight text-ink">
                            Inspector
                        </p>
                        <nav className="flex items-center gap-2 sm:gap-3">
                            <AppearanceToggle />
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas transition hover:opacity-90"
                                >
                                    Abrir painel
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-3 py-2 text-sm font-medium text-ink/80 transition hover:text-ink"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas transition hover:opacity-90"
                                    >
                                        Criar conta
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main id="conteudo">
                    <section
                        ref={heroRef}
                        className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pb-24"
                    >
                        <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{
                                background:
                                    'var(--auth-glow)',
                            }}
                        />
                        <motion.div
                            style={{ y: heroY, opacity: heroOpacity }}
                            className="relative mx-auto w-full max-w-6xl"
                        >
                            <motion.div
                                className="mb-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                {storyItems.map((item, index) => (
                                    <div
                                        key={item.label}
                                        className="flex w-[4.75rem] flex-col items-center gap-2 sm:w-24"
                                    >
                                        <StoryRing delay={index * 0.4}>
                                            {item.value}
                                        </StoryRing>
                                        <span className="text-[0.7rem] text-ink-muted">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.p
                                className="mb-4 max-w-3xl font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance text-ink"
                                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.75,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.05,
                                }}
                            >
                                Inspector
                            </motion.p>

                            <motion.h1
                                className="mb-5 max-w-2xl text-[clamp(1.35rem,3.4vw,2rem)] leading-snug font-medium text-pretty text-ink-warm"
                                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.7,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.12,
                                }}
                            >
                                Monitore APIs e webhooks com alertas do seu
                                jeito — em vários endpoints, com a autenticação
                                que a sua stack já usa.
                            </motion.h1>

                            <motion.p
                                className="mb-8 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
                                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.65,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.18,
                                }}
                            >
                                Checagens contínuas, histórico de latência,
                                falhas consecutivas e avisos de queda ou
                                recuperação. Um painel para o time inteiro, sem
                                planilha improvisada.
                            </motion.p>

                            <motion.div
                                className="flex flex-wrap items-center gap-3"
                                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.24,
                                }}
                            >
                                <Link
                                    href={primaryCta}
                                    className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:opacity-90"
                                >
                                    {primaryLabel}
                                </Link>
                                <a
                                    href="#apis"
                                    className="inline-flex items-center justify-center rounded-full border border-hairline px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/30"
                                >
                                    Ver recursos
                                </a>
                            </motion.div>
                        </motion.div>
                    </section>

                    <SectionNav />

                    <section
                        id="produto"
                        className="relative border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                            <FadeIn>
                                <h2 className="mb-4 max-w-lg text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Vários monitores. Um único olhar.
                                </h2>
                                <p className="mb-6 max-w-md text-base leading-relaxed text-ink-muted">
                                    Cadastre quantos endpoints precisar —
                                    checkout, auth, billing, inventário. Cada um
                                    com frequência própria (10s, 30s ou 60s),
                                    método HTTP e credenciais isoladas.
                                </p>
                                <p className="max-w-md text-sm leading-relaxed text-ink-muted">
                                    No feed você vê quem está saudável, quem
                                    demorou e quem falhou em sequência. Ideal
                                    para produtos com dezenas de dependências
                                    externas.
                                </p>
                            </FadeIn>
                            <PhoneStage />
                        </div>
                    </section>

                    <section
                        id="apis"
                        className="border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-6xl">
                            <FadeIn className="mb-12 max-w-2xl">
                                <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Monitoramento de APIs de ponta a ponta
                                </h2>
                                <p className="text-base leading-relaxed text-ink-muted">
                                    O Inspector chama a sua URL nos intervalos
                                    que você escolhe, registra status e tempo de
                                    resposta e monta o histórico para auditoria
                                    e post-mortem.
                                </p>
                            </FadeIn>
                            <div className="grid gap-8 md:grid-cols-2">
                                {[
                                    {
                                        title: 'Métodos HTTP reais',
                                        body: 'GET, POST, PUT e DELETE — monitore leitura, escrita e exclusão como o cliente de verdade faria.',
                                    },
                                    {
                                        title: 'Frequência sob controle',
                                        body: 'A cada 10, 30 ou 60 segundos. Crítico sobe a cadência; serviços estáveis relaxam o ritmo.',
                                    },
                                    {
                                        title: 'Status + latência',
                                        body: 'Não basta “estar no ar”: se a API responde em 900ms, o Inspector marca e você age.',
                                    },
                                    {
                                        title: 'Histórico por checagem',
                                        body: 'Cada tentativa fica registrada. Compare horários, falhas consecutivas e recuperação com contexto.',
                                    },
                                ].map((item, index) => (
                                    <FadeIn
                                        key={item.title}
                                        delay={index * 0.06}
                                        className="border-t border-hairline pt-6"
                                    >
                                        <h3 className="mb-2 text-xl font-semibold tracking-tight text-ink">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ink-muted">
                                            {item.body}
                                        </p>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="webhooks"
                        className="relative overflow-hidden border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div
                            aria-hidden
                            className="absolute inset-0 opacity-80"
                            style={{
                                background:
                                    'radial-gradient(ellipse 55% 60% at 85% 20%, rgba(245,133,41,0.14), transparent 55%)',
                            }}
                        />
                        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <FadeIn>
                                <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Webhooks sob vigilância
                                </h2>
                                <p className="mb-5 text-base leading-relaxed text-ink-muted">
                                    Gateways de pagamento, CRMs e filas avisam
                                    por webhook — e quando o receptor falha, o
                                    negócio some no silêncio. O Inspector trata
                                    esses endpoints como monitores de primeira
                                    classe.
                                </p>
                                <ul className="space-y-3 text-sm text-ink-muted">
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-warm" />
                                        Acompanhe disponibilidade do receptor
                                        que seus provedores chamam
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                                        Combine com APIs REST no mesmo painel
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#8134af]" />
                                        Alertas quando o canal de eventos
                                        esquenta ou some
                                    </li>
                                </ul>
                            </FadeIn>
                            <FadeIn delay={0.1}>
                                <div className="rounded-[1.5rem] border border-hairline bg-surface p-6 sm:p-8">
                                    <p className="mb-6 text-xs font-medium tracking-wide text-ink-soft uppercase">
                                        Fluxo típico
                                    </p>
                                    <ol className="space-y-5">
                                        {[
                                            'Provedor dispara o webhook para a sua URL',
                                            'Inspector verifica se o endpoint responde a tempo',
                                            'Se falhar ou atrasar, o alerta sobe no canal certo',
                                            'Quando recupera, o time recebe a confirmação',
                                        ].map((step, index) => (
                                            <li
                                                key={step}
                                                className="flex gap-4"
                                            >
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-semibold text-ink">
                                                    {index + 1}
                                                </span>
                                                <p className="pt-1.5 text-sm leading-relaxed text-ink-muted">
                                                    {step}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </FadeIn>
                        </div>
                    </section>

                    <section
                        id="alertas"
                        className="border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-6xl">
                            <FadeIn className="mb-12 max-w-2xl">
                                <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Alertas customizáveis por monitor
                                </h2>
                                <p className="text-base leading-relaxed text-ink-muted">
                                    Cada API pode ter regras próprias: o que
                                    dispara, depois de quantas falhas e quem
                                    recebe. Menos ruído, mais sinal.
                                </p>
                            </FadeIn>
                            <div className="grid gap-8 sm:grid-cols-2">
                                {alertRules.map((rule, index) => (
                                    <FadeIn
                                        key={rule.title}
                                        delay={index * 0.05}
                                        className="border-t border-hairline pt-6"
                                    >
                                        <h3 className="mb-2 text-lg font-semibold text-ink">
                                            {rule.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ink-muted">
                                            {rule.body}
                                        </p>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="conexao"
                        className="border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto max-w-6xl">
                            <FadeIn className="mb-4 max-w-2xl">
                                <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Conecte do jeito que a API exige
                                </h2>
                                <p className="mb-10 text-base leading-relaxed text-ink-muted">
                                    Nem toda API é pública. O Inspector fala os
                                    dialetos de autenticação mais comuns —
                                    sem gambiarra de proxy local.
                                </p>
                            </FadeIn>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {authMethods.map((method, index) => (
                                    <FadeIn
                                        key={method.name}
                                        delay={index * 0.05}
                                        className="rounded-2xl border border-hairline bg-surface p-5"
                                    >
                                        <p className="mb-3 text-sm font-semibold text-ink">
                                            {method.name}
                                        </p>
                                        <p className="text-xs leading-relaxed text-ink-muted">
                                            {method.body}
                                        </p>
                                    </FadeIn>
                                ))}
                            </div>
                            <FadeIn delay={0.15} className="mt-10 max-w-2xl">
                                <p className="text-sm leading-relaxed text-ink-muted">
                                    Combine autenticação com headers extras e o
                                    verbo HTTP certo. Assim o monitor reflete o
                                    contrato real da integração — não um ping
                                    genérico sem credencial.
                                </p>
                            </FadeIn>
                        </div>
                    </section>

                    <section
                        id="seguranca"
                        className="relative overflow-hidden border-t border-hairline px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse 50% 55% at 10% 80%, rgba(221,42,123,0.12), transparent 50%)',
                            }}
                        />
                        <div className="relative mx-auto max-w-6xl">
                            <FadeIn className="mb-12 max-w-2xl">
                                <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
                                    Segurança no acesso e nos canais
                                </h2>
                                <p className="text-base leading-relaxed text-ink-muted">
                                    Monitorar produção exige confiança. Conta,
                                    sessão e notificações foram pensadas para
                                    times que lidam com dados sensíveis.
                                </p>
                            </FadeIn>
                            <div className="grid gap-8 md:grid-cols-3">
                                {[
                                    {
                                        title: 'Conta protegida',
                                        body: 'Login com e-mail verificado, senha com hash moderno e autenticação em dois fatores (2FA) com códigos de recuperação.',
                                    },
                                    {
                                        title: 'Sessões criptografadas',
                                        body: 'Sessão e cache em Redis com criptografia de sessão em produção — menos superfície exposta no app.',
                                    },
                                    {
                                        title: 'Canais com prova de dono',
                                        body: 'Antes de receber alerta, o e-mail/canal passa por verificação. Nada de notificar endereço errado por engano.',
                                    },
                                ].map((item, index) => (
                                    <FadeIn
                                        key={item.title}
                                        delay={index * 0.07}
                                        className="border-t border-hairline pt-6"
                                    >
                                        <h3 className="mb-3 text-lg font-semibold text-ink">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ink-muted">
                                            {item.body}
                                        </p>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden border-t border-hairline px-5 py-24 sm:px-8 sm:py-32">
                        <div
                            aria-hidden
                            className="absolute inset-0 opacity-90"
                            style={{
                                background:
                                    'radial-gradient(ellipse 70% 80% at 20% 50%, rgba(245,133,41,0.16), transparent 55%), radial-gradient(ellipse 60% 70% at 90% 30%, rgba(221,42,123,0.2), transparent 50%)',
                            }}
                        />
                        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6 text-left sm:items-center sm:text-center">
                            <p className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-tight font-semibold tracking-[-0.03em] text-balance text-ink">
                                APIs, webhooks e alertas — no mesmo Inspector
                            </p>
                            <p className="max-w-xl text-base leading-relaxed text-ink-muted">
                                Crie a conta, cadastre o primeiro endpoint com
                                a autenticação certa e configure quem avisa
                                quando cair. Em minutos você deixa de adivinhar
                                se a integração está no ar.
                            </p>
                            <Link
                                href={primaryCta}
                                className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-canvas transition hover:opacity-90"
                            >
                                {auth.user
                                    ? 'Continuar no painel'
                                    : 'Começar a monitorar'}
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-hairline px-5 py-8 sm:px-8">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-ink/80">
                            Inspector
                        </p>
                        <p className="text-xs text-ink-soft">
                            Monitoramento de APIs e webhooks para times que não
                            podem adivinhar.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
