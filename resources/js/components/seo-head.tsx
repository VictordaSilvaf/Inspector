import { Head, usePage } from '@inertiajs/react';
import type { SeoHeadProps, SharedSeo } from '@/types/seo';

function formatTitle(title: string | undefined, siteName: string): string {
    if (! title) {
        return siteName;
    }

    return `${title} | ${siteName}`;
}

export default function SeoHead({
    title,
    description,
    image,
    robots = 'noindex, nofollow',
    canonical,
    keywords,
    jsonLd,
}: SeoHeadProps) {
    const page = usePage<{ seo: SharedSeo }>();
    const seo = page.props.seo;

    const metaDescription = description ?? seo.defaultDescription;
    const metaKeywords = keywords ?? seo.keywords;
    const ogImage = image ?? seo.ogImage;
    const fullTitle = formatTitle(title, seo.siteName);
    const canonicalUrl = canonical ?? `${seo.url}${page.url}`;

    const jsonLdPayload = jsonLd
        ? JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])
        : null;

    return (
        <Head title={title}>
            <meta head-key="description" name="description" content={metaDescription} />
            <meta head-key="keywords" name="keywords" content={metaKeywords} />
            <meta head-key="robots" name="robots" content={robots} />
            <link head-key="canonical" rel="canonical" href={canonicalUrl} />

            <meta head-key="og:type" property="og:type" content="website" />
            <meta head-key="og:site_name" property="og:site_name" content={seo.siteName} />
            <meta head-key="og:title" property="og:title" content={fullTitle} />
            <meta
                head-key="og:description"
                property="og:description"
                content={metaDescription}
            />
            <meta head-key="og:url" property="og:url" content={canonicalUrl} />
            <meta head-key="og:image" property="og:image" content={ogImage} />
            <meta head-key="og:locale" property="og:locale" content={seo.locale} />

            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <meta head-key="twitter:title" name="twitter:title" content={fullTitle} />
            <meta
                head-key="twitter:description"
                name="twitter:description"
                content={metaDescription}
            />
            <meta head-key="twitter:image" name="twitter:image" content={ogImage} />
            {seo.twitterHandle ? (
                <meta head-key="twitter:site" name="twitter:site" content={seo.twitterHandle} />
            ) : null}

            {jsonLdPayload ? (
                <script head-key="json-ld" type="application/ld+json">
                    {jsonLdPayload}
                </script>
            ) : null}
        </Head>
    );
}
