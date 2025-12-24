import {TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {AnalyticsPlugin_Base} from './AnalyticsPlugin_Base.js';

export const pluginKey_Logger = 'logger';

export class AnalyticsPlugin_Logger
	extends AnalyticsPlugin_Base {

	public key = pluginKey_Logger;

	protected translateEvent(event: TSAnalyticsEvent) {
		return event;
	}

	protected updateUser_Impl = undefined;
	protected updateLexicon_Impl = undefined;

	protected sendEvents = async (events: any[]) => {
		this.logInfoBold('######## Analytics Event - Start ########');
		this.logInfo(events);
		this.logInfoBold('######## Analytics Event - End ########');
	};
}