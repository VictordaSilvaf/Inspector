export type PlanCatalogItem = {
    id: string;
    name: string;
    description: string;
    monthlyPriceCents: number;
    monthlyPriceLabel: string;
    highlighted: boolean;
    features: string[];
    limits: {
        plan: string;
        planLabel: string;
        maxMonitors: number;
        minIntervalSeconds: number;
        allowedIntervals: number[];
        maxAlertsPerMonitor: number | null;
        maxNotificationChannels: number | null;
        historyRetentionDays: number;
        credentialAudit: boolean;
        credentialAuditExport: boolean;
        requiresTwoFactor: boolean;
    };
};

export type SubscriptionUsage = {
    monitors: number;
    notificationChannels: number;
};
