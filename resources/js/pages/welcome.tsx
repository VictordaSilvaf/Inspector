import { Head, Link, usePage } from '@inertiajs/react';
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'motion/react';
import { useEffect, useRef } from 'react';
import { dashboard, login, register } from '@/routes';

const storyItems = [
    { label: 'Uptime', value: '99,98%', tone: 'ok' as const },
    { label: 'Latência', value: '142ms', tone: 'warn' as const },
    { label: 'Alertas', value: 'ao vivo', tone: 'hot' as const },
    { label: 'APIs', value: '24/7', tone: 'ok' as const },
];

const moments = [
    {
        title: 'Veja a saúde da API como um story',
        body: 'Status, tempo de resposta e falhas consecutivas em um olhar — no ritmo do feed, não de uma planilha.',
    },
    {
        title: 'Alertas que chegam quando importa',
        body: 'Queda, lentidão ou recuperação: o Inspector avisa no canal certo, sem ruído de dashboard.',
    },
    {
        title: 'Do endpoint ao histórico em segundos',
        body: 'Cadastre a URL, escolha o intervalo e acompanhe cada checagem com contexto real de produção.',
    },
];

function StoryRing({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
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
            <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-[#0c0b0a] p-[3px]">
                <div className="flex size-full items-center justify-center rounded-full bg-[#161412] text-center text-[0.65rem] font-semibold leading-tight text-[#f5f0ea] sm:text-xs">
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
            className="relative mx-auto w-full max-w-[320px]"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
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
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#12100e] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <p className="font-display text-sm font-semibold tracking-tight text-[#f7f2ec]">
                        Inspector
                    </p>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-300">
                        online
                    </span>
                </div>
                <div className="space-y-3 px-5 pb-6">
                    {[
                        { name: 'checkout-api', ms: 128, ok: true },
                        { name: 'auth-service', ms: 86, ok: true },
                        { name: 'billing-webhook', ms: 942, ok: false },
                    ].map((row, index) => (
                        <motion.div
                            key={row.name}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-3"
                            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                            whileInView={
                                reduceMotion ? undefined : { opacity: 1, x: 0 }
                            }
                            viewport={{ once: true }}
                            transition={{
                                delay: 0.15 + index * 0.08,
                                duration: 0.45,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        >
                            <div>
                                <p className="text-sm font-medium text-[#f3ebe3]">
                                    {row.name}
                                </p>
                                <p className="text-xs text-[#a89b90]">
                                    {row.ok ? 'Resposta OK' : 'Tempo alto'}
                                </p>
                            </div>
                            <p
                                className={
                                    row.ok
                                        ? 'font-display text-sm font-semibold text-emerald-300'
                                        : 'font-display text-sm font-semibold text-[#ff8a4c]'
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

export default function Welcome() {
    const { auth } = usePage().props;
    const reduceMotion = useReducedMotion();
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 80]);
    const heroOpacity = useTransform(
        scrollYProgress,
        [0, 0.85],
        [1, reduceMotion ? 1 : 0.35],
    );

    return (
        <>
            <Head title="Monitore suas APIs com clareza" />

            <div className="min-h-screen bg-[#0c0b0a] font-display text-[#f5f0ea] antialiased selection:bg-[#dd2a7b]/35 selection:text-white">
                <a
                    href="#conteudo"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
                >
                    Ir para o conteúdo
                </a>

                <header className="absolute inset-x-0 top-0 z-20">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
                        <p className="text-lg font-semibold tracking-tight text-white">
                            Inspector
                        </p>
                        <nav className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
                                >
                                    Abrir painel
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-3 py-2 text-sm font-medium text-[#f5f0ea]/80 transition hover:text-white"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
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
                                    'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(221,42,123,0.28), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 40%, rgba(245,133,41,0.18), transparent 50%), linear-gradient(180deg, #120f0d 0%, #0c0b0a 55%, #0c0b0a 100%)',
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
                                        <span className="text-[0.7rem] text-[#b5a89c]">
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.p
                                className="mb-4 max-w-3xl font-display text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance text-white"
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
                                className="mb-5 max-w-2xl text-[clamp(1.35rem,3.4vw,2rem)] leading-snug font-medium text-pretty text-[#f3ebe3]"
                                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.7,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.12,
                                }}
                            >
                                Monitore APIs com a clareza de um feed — e a
                                urgência de um alerta real.
                            </motion.h1>

                            <motion.p
                                className="mb-8 max-w-xl text-base leading-relaxed text-[#b5a89c] sm:text-lg"
                                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.65,
                                    ease: [0.16, 1, 0.3, 1],
                                    delay: 0.18,
                                }}
                            >
                                Latência, status e falhas consecutivas em um só
                                lugar. Receba avisos quando cair e quando
                                voltar — sem caçar gráfico às 3 da manhã.
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
                                    href={auth.user ? dashboard() : register()}
                                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
                                >
                                    {auth.user
                                        ? 'Ir para o painel'
                                        : 'Começar grátis'}
                                </Link>
                                <a
                                    href="#produto"
                                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-[#f5f0ea] transition hover:border-white/40"
                                >
                                    Ver como funciona
                                </a>
                            </motion.div>
                        </motion.div>
                    </section>

                    <section
                        id="produto"
                        className="relative border-t border-white/5 px-5 py-20 sm:px-8 sm:py-28"
                    >
                        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                            <div>
                                <h2 className="mb-4 max-w-lg text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-white">
                                    O produto na tela, não só no discurso
                                </h2>
                                <p className="mb-8 max-w-md text-base leading-relaxed text-[#b5a89c]">
                                    Cada checagem vira um quadro legível: verde
                                    quando responde, destaque quando atrasa,
                                    histórico quando você precisa explicar o
                                    incidente.
                                </p>
                                <ul className="space-y-4 text-sm text-[#d7cbc0]">
                                    <li className="flex gap-3">
                                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#dd2a7b]" />
                                        Intervalos flexíveis e checagens
                                        contínuas
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#f58529]" />
                                        Alertas por e-mail com recuperação
                                        incluída
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#8134af]" />
                                        Autenticação Bearer, API Key e headers
                                        custom
                                    </li>
                                </ul>
                            </div>
                            <PhoneStage />
                        </div>
                    </section>

                    <section className="border-t border-white/5 px-5 py-20 sm:px-8 sm:py-28">
                        <div className="mx-auto max-w-6xl">
                            <h2 className="mb-12 max-w-2xl text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-white">
                                Três momentos do dia a dia com o Inspector
                            </h2>
                            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
                                {moments.map((moment, index) => (
                                    <motion.article
                                        key={moment.title}
                                        className="relative border-t border-white/15 pt-6"
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { opacity: 0, y: 20 }
                                        }
                                        whileInView={
                                            reduceMotion
                                                ? undefined
                                                : { opacity: 1, y: 0 }
                                        }
                                        viewport={{ once: true, amount: 0.35 }}
                                        transition={{
                                            delay: index * 0.08,
                                            duration: 0.55,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                    >
                                        <p className="mb-3 text-sm text-[#a89b90]">
                                            {String(index + 1).padStart(2, '0')}
                                        </p>
                                        <h3 className="mb-3 text-xl font-semibold tracking-tight text-pretty text-white">
                                            {moment.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-[#b5a89c]">
                                            {moment.body}
                                        </p>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden border-t border-white/5 px-5 py-24 sm:px-8 sm:py-32">
                        <div
                            aria-hidden
                            className="absolute inset-0 opacity-90"
                            style={{
                                background:
                                    'radial-gradient(ellipse 70% 80% at 20% 50%, rgba(245,133,41,0.16), transparent 55%), radial-gradient(ellipse 60% 70% at 90% 30%, rgba(221,42,123,0.2), transparent 50%)',
                            }}
                        />
                        <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6 text-left sm:items-center sm:text-center">
                            <p className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-tight font-semibold tracking-[-0.03em] text-balance text-white">
                                Sua API no ar. Você no controle.
                            </p>
                            <p className="max-w-xl text-base leading-relaxed text-[#b5a89c]">
                                Crie sua conta, conecte o primeiro endpoint e
                                receba o próximo alerta antes do cliente
                                reclamar.
                            </p>
                            <Link
                                href={auth.user ? dashboard() : register()}
                                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0c0b0a] transition hover:bg-[#f3ebe3]"
                            >
                                {auth.user
                                    ? 'Continuar no painel'
                                    : 'Criar minha conta'}
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-white/5 px-5 py-8 sm:px-8">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-[#f5f0ea]/80">
                            Inspector
                        </p>
                        <p className="text-xs text-[#8f8378]">
                            Monitoramento de APIs para times que não podem
                            adivinhar.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
