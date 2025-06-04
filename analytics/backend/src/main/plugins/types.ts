import {TSAnalyticsEvent} from '@nu-art/analytics-shared/src/main';

/**
 * C - plugin specific config, to be used later in interface implementations
 * R - Translation response
 */
export interface TSAnalyticsPlugin<C extends Record<string, any> = {}, R extends any = any> {
	/**
	 * Unique key used to identify this plugin and retrieve its config.
	 * Example: 'mixpanel', 'amplitude', 'customLogger'
	 */
	key: string;

	/**
	 * Called to initialize the plugin with configuration data (fetched from Firebase or elsewhere).
	 */
	init(config: C): void;

	/**
	 * Translates the in-house AnalyticsEvent into the format this provider expects.
	 */
	translate(event: TSAnalyticsEvent): R;

	/**
	 * Sends the event to the provider.
	 */
	send(event: TSAnalyticsEvent): Promise<void>;

	/**
	 * Sends multiple events to the provider.
	 */
	bulkSend?(events: TSAnalyticsEvent[]): Promise<void>;
}