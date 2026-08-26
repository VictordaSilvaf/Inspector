export type SharedSeo = {
    siteName: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string;
    ogImage: string;
    twitterHandle: string | null;
    locale: string;
    url: string;
};

export type SeoRobots = 'index, follow' | 'noindex, nofollow' | 'noindex, follow';

export type SeoHeadProps = {
    title?: string;
    description?: string;
    image?: string;
    robots?: SeoRobots;
    canonical?: string;
    keywords?: string;
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};
