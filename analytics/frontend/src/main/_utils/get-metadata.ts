import { TSAnalyticsEventMetadata } from '@nu-art/analytics-shared';
import { Thunder } from "@nu-art/web-client/index";
export function getBaseAnalyticsMetadata(): TSAnalyticsEventMetadata {
    return {
        env: Thunder.getInstance().getConfig().label,
    };
}
