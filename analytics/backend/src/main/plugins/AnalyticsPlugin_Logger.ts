import {TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {AnalyticsPlugin_Base} from './AnalyticsPlugin_Base';

export const pluginKey_Logger = 'logger';

export class AnalyticsPlugin_Logger
	extends AnalyticsPlugin_Base {

	public key = pluginKey_Logger;

	protected translateEvent(event: TSAnalyticsEvent) {
		return event;
	}

	protected async sendEvents(events: any[]) {
		this.logInfoBold('######## Analytics Event - Start ########');
		this.logInfo(events);
		this.logInfoBold('######## Analytics Event - End ########');
	}
}