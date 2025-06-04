import {Module} from '@nu-art/ts-common';
import {TSAnalyticsPlugin} from './plugins/types';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {TSAnalyticsEvent} from '@nu-art/analytics-shared/src/main';

type Config = {
	eventsBulkSize?: number;
};

class ModuleBE_Analytics_Class
	extends Module<Config> {

	private readonly plugins: Map<string, TSAnalyticsPlugin> = new Map();
	private sendQueue!: QueueV2<TSAnalyticsEvent>;

	protected init() {
		super.init();
		this.sendQueue = new QueueV2('ts-analytics', this.queueRunner);
	}

	//######################### Plugin Management #########################

	public addPlugin(plugin: TSAnalyticsPlugin) {
		this.plugins.set(plugin.key, plugin);
	}

	public removePlugin(plugin: TSAnalyticsPlugin) {
		this.plugins.delete(plugin.key);
	}

	//######################### Queue Management #########################

	private queueRunner = async (event: TSAnalyticsEvent) => {
		const plugins = Array.from(this.plugins.values());
		await Promise.all(plugins.map(async plugin => {
			return plugin.send(event);
		}));
	};

	public addEventToQueue = (event: TSAnalyticsEvent) => {
		this.sendQueue.addItem(event);
	};

	//######################### API Callbacks #########################
}

export const ModuleBE_Analytics = new ModuleBE_Analytics_Class();