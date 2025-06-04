import {TSAnalyticsEvent} from '@nu-art/analytics-shared/src/main';
import {TSAnalyticsPlugin} from './types';
import {BadImplementationException, exists, MissingDataException} from '@nu-art/ts-common';
import mixpanelLib, {Mixpanel} from 'mixpanel';

const pluginKey_MixedPanels = 'mixed-panels';

type Config = {
	token: string;
	config?: Partial<mixpanelLib.InitConfig>;
};

type MixedPanelsEvent = {
	distinct_id: string;
	time: number;
	// Optional metadata fields commonly used
	$session_id?: string;
	$group_id?: string;
	// Any custom event-specific properties (typed later per event if needed)
	[key: string]: any;
};

type MixedPanelsBulkEvent = {
	event: string;
	properties: MixedPanelsEvent;
}

export class Plugin_MixedPanels
	implements TSAnalyticsPlugin<Config, MixedPanelsEvent> {

	key = pluginKey_MixedPanels;
	private mixpanel: Mixpanel | undefined;

	init(config: Config): void {
		if (!config.token)
			throw new MissingDataException(`Missing token for analytics plugin "${pluginKey_MixedPanels}"`);
		this.mixpanel = mixpanelLib.init(config.token, config.config);
	}

	translate(event: TSAnalyticsEvent): MixedPanelsEvent {
		return {
			distinct_id: event.userId ?? 'unknown',
			time: Math.floor(event.timestamp / 1000), //Mixed panels expects seconds
			...(exists(event.sessionId) ? {$session_id: event.sessionId} : {}),
			...(exists(event.groupId) ? {$group_id: event.groupId} : {}),
			...(exists(event.context) ? event.context : {}),
			...(exists(event.properties) ? event.properties : {}),
		};
	}

	async send(event: TSAnalyticsEvent): Promise<void> {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling send before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		const translatedEvent = this.translate(event);
		return new Promise<void>((resolve, reject) => {
			this.mixpanel!.track(event.key, translatedEvent, (err: Error | undefined) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	async bulkSend(events: TSAnalyticsEvent[]): Promise<void> {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling send before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		const translatedEvents: MixedPanelsBulkEvent[] = events.map(event => ({
			event: event.key,
			properties: this.translate(event),
		}));

		return new Promise<void>((resolve, reject) => {
			this.mixpanel!.track_batch(translatedEvents, {}, (errors: Error[] | undefined) => {
				if (errors?.length) reject(errors);
				else resolve();
			});
		});
	}
}