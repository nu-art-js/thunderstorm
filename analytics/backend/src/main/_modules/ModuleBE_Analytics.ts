import {ApiHandler} from '@nu-art/http-server';
import {Module} from '@nu-art/ts-common';
import {AnalyticsPlugin_Base} from '../plugins/AnalyticsPlugin_Base.js';
import {API_Analytics, ApiDef_Analytics} from '@nu-art/analytics-shared';
import {AnalyticsPluginRegistry} from '../plugins/registry.js';

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

	@ApiHandler(() => ApiDef_Analytics().sendEvent)
	protected async api_sendEvent(body: API_Analytics['sendEvent']['Body']): Promise<API_Analytics['sendEvent']['Response']> {
		return this.plugins.forEach(plugin => {
			plugin.registerEvent(body.event);
		});
	}

	@ApiHandler(() => ApiDef_Analytics().updateUser)
	protected async api_updateUser(body: API_Analytics['updateUser']['Body']): Promise<API_Analytics['updateUser']['Response']> {
		return this.plugins.forEach(plugin => {
			plugin.updateUser?.(body);
		});
	}

	@ApiHandler(() => ApiDef_Analytics().updateLexicon)
	protected async api_updateLexicon(body: API_Analytics['updateLexicon']['Body']): Promise<API_Analytics['updateLexicon']['Response']> {
		return this.plugins.forEach(plugin => {
			plugin.updateLexicon?.(body);
		});
	}
}

export const ModuleBE_Analytics = new ModuleBE_Analytics_Class();