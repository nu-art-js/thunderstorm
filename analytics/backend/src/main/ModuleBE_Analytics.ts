import {Module} from '@nu-art/ts-common';
import {AnalyticsPanel_Base} from './plugins/AnalyticsPanel_Base';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {Analytics_SendEvent, ApiDef_Analytics} from '@nu-art/analytics-shared';

class ModuleBE_Analytics_Class
	extends Module {

	private readonly plugins: Map<string, AnalyticsPanel_Base> = new Map();

	protected init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_Analytics._v1.sendEvent, this.api_sendEvent),
		]);
	}

	//######################### Plugin Management #########################

	public addPlugin(plugin: AnalyticsPanel_Base) {
		this.plugins.set(plugin.key, plugin);
	}

	public removePlugin(plugin: AnalyticsPanel_Base) {
		this.plugins.delete(plugin.key);
	}

	//######################### API Callbacks #########################

	private api_sendEvent = async (request: Analytics_SendEvent['request']): Promise<Analytics_SendEvent['response']> => {
		this.plugins.forEach(plugin => {
		})
	};
}

export const ModuleBE_Analytics = new ModuleBE_Analytics_Class();