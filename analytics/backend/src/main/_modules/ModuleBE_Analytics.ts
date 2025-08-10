import {Module} from '@nu-art/ts-common';
import {AnalyticsPlugin_Base} from '../plugins/AnalyticsPlugin_Base';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {Analytics_SendEvent, Analytics_UpdateUser, ApiDef_Analytics} from '@nu-art/analytics-shared';
import {AnalyticsPluginRegistry} from '../plugins';

type Config = {
	plugins: {
		[K in keyof AnalyticsPluginRegistry]: AnalyticsPluginRegistry[K] extends AnalyticsPlugin_Base<any, infer C> ? C : never
	}
}

class ModuleBE_Analytics_Class
	extends Module<Config> {

	private readonly plugins: Map<string, AnalyticsPlugin_Base> = new Map();

	protected init() {
		super.init();
		this.initPlugins();
		addRoutes([
			createBodyServerApi(ApiDef_Analytics()._v1.sendEvent, this.api_sendEvent),
			createBodyServerApi(ApiDef_Analytics()._v1.updateUser, this.api_updateUser),
		]);
	}

	//######################### Plugin Management #########################

	public addPlugin(plugin: AnalyticsPlugin_Base) {
		this.plugins.set(plugin.key, plugin);
	}

	public removePlugin(plugin: AnalyticsPlugin_Base) {
		this.plugins.delete(plugin.key);
	}

	private initPlugins() {
		this.plugins.forEach(plugin => {
			const key = plugin.key as keyof AnalyticsPluginRegistry;
			const pluginConfig = this.config.plugins[key];
			plugin.init(pluginConfig);
		});
	}

	//######################### API Callbacks #########################

	private api_sendEvent = async (request: Analytics_SendEvent['request']): Promise<Analytics_SendEvent['response']> => {
		this.plugins.forEach(plugin => {
			plugin.registerEvent(request.event);
		});
	};

	private api_updateUser = async (request: Analytics_UpdateUser['request']): Promise<Analytics_UpdateUser['response']> => {
		this.plugins.forEach(plugin => {
			plugin.updateUser?.(request);
		});
	};
}

export const ModuleBE_Analytics = new ModuleBE_Analytics_Class();