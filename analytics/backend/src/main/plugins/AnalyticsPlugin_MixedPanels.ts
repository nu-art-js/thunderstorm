import {TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {AnalyticsPlugin_Base} from './AnalyticsPlugin_Base';
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

export const pluginKey_MixedPanels = 'mixed-panels';

type MPConfig = AnalyticPanelConfig<{ mxConfig?: Partial<mixpanelLib.InitConfig> }>

export class AnalyticsPlugin_MixedPanels
	extends AnalyticsPlugin_Base<MixedPanelsEvent, MPConfig> {

	public readonly key = pluginKey_MixedPanels;
	private mixpanel: Mixpanel | undefined;

	init(config: MPConfig) {
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

	protected sendEvents = async (events: MixedPanelsEvent[]) => {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling send before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		return new Promise<void>((resolve, reject) => {
			this.logDebug('Sending Events');
			this.logInfo(events);
			this.mixpanel!.track_batch(events, {}, (errors: Error[] | undefined) => {
				if (errors?.length) {
					this.logError(errors);
					reject(errors);
				} else {
					this.logDebug('Events Sent');
					resolve();
				}
			});
		});
	};
}