import {TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {AnalyticsPanel_Base} from './AnalyticsPanel_Base';
import mixpanelLib, {Mixpanel} from 'mixpanel';
import {BadImplementationException, exists, MissingDataException} from '@nu-art/ts-common';
import {AnalyticPanelConfig} from './types';

type MixedPanelsEventProperties = {
	distinct_id: string;
	time: number;
	// Optional metadata fields commonly used
	$session_id?: string;
	$group_id?: string;
	// Any custom event-specific properties (typed later per event if needed)
	[key: string]: any;
};

type MixedPanelsEvent = {
	event: string;
	properties: MixedPanelsEventProperties;
}

const pluginKey_MixedPanels = 'mixed-panels';

type Config = AnalyticPanelConfig<{ mxConfig?: Partial<mixpanelLib.InitConfig> }>

export class AnalyticsPlugin_MixedPanels
	extends AnalyticsPanel_Base<MixedPanelsEvent, Config> {

	public readonly key = pluginKey_MixedPanels;
	private mixpanel: Mixpanel | undefined;

	init(config: Config) {
		super.init(config);
		if (!config.token)
			throw new MissingDataException(`Missing token for analytics plugin "${pluginKey_MixedPanels}"`);
		this.mixpanel = mixpanelLib.init(config.token, config.mxConfig);
	}

	protected translateEvent(event: TSAnalyticsEvent): MixedPanelsEvent {
		return {
			event: event.key,
			properties: {
				distinct_id: event.userId ?? 'unknown',
				time: Math.floor(event.timestamp / 1000), //Mixed panels expects seconds
				...(exists(event.sessionId) ? {$session_id: event.sessionId} : {}),
				...(exists(event.groupId) ? {$group_id: event.groupId} : {}),
				...(exists(event.context) ? event.context : {}),
				...(exists(event.properties) ? event.properties : {}),
			}
		};
	}

	protected async sendEvents(events: MixedPanelsEvent[]) {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling send before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		return new Promise<void>((resolve, reject) => {
			this.mixpanel!.track_batch(events, {}, (errors: Error[] | undefined) => {
				if (errors?.length) reject(errors);
				else resolve();
			});
		});
	}
}