import {TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {debounce, Logger, LogLevel} from '@nu-art/ts-common';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {AnalyticsPluginBaseConfig} from './types';

/**
 * C - plugin specific config, to be used later in interface implementations
 * R - Translation response
 */
export abstract class AnalyticsPlugin_Base<
	R extends any = any,
	C extends AnalyticsPluginBaseConfig = AnalyticsPluginBaseConfig
>
	extends Logger {
	/**
	 * Unique key used to identify this plugin and retrieve its config.
	 * Example: 'mixpanel', 'amplitude', 'customLogger'
	 */
	public readonly abstract key: string;
	/**
	 * the config of the plugin, keeping important plugin specific data
	 * @private
	 */
	protected config: C | undefined;
	/**
	 * An event buffer, to packet the events into groups so they can later be bulk sent
	 * @private
	 */
	private eventBuffer: R[] = [];
	/**
	 * A debouncer for the "Empty event buffer" functionality.
	 * @private
	 */
	private debounce_EmptyEventBuffer = debounce(() => this.emptyEventBuffer(), 200, 2000);
	/**
	 * A queue for sending the events to the provider.
	 * @private
	 */
	private queue_Events: QueueV2<R[]> = new QueueV2('plugin-events', this.sendEvents);

	//######################### Abstract Logic #########################

	protected abstract translateEvent(event: TSAnalyticsEvent): R;

	protected abstract sendEvents(events: R[]): Promise<void>;

	//######################### Initialization #########################

	init(config: C) {
		this.config = config;
		const tag = `AnalyticsPlugin_${this.key}`;
		this.setTag(tag);
		this.setMinLevel(LogLevel.Info);
		const message = `Loaded - ${this.config.active ? 'Active' : 'Inactive'}`;
		this.logInfo(message);
	}

	//######################### Internal Logic #########################

	private emptyEventBuffer = () => {
		if (this.eventBuffer.length === 0)
			return;

		this.queue_Events.addItem([...this.eventBuffer]);
		this.eventBuffer = [];
	};

	//######################### Public Logic #########################

	public registerEvent(event: TSAnalyticsEvent) {
		if (!this.config?.active)
			return;

		const translatedEvent = this.translateEvent(event);
		this.eventBuffer.push(translatedEvent);
		//If the max packet size has not been reached
		if (this.eventBuffer.length < this.config!.eventPacketSize)
			return this.debounce_EmptyEventBuffer();

		//Max packet size has been reached, empty the buffer now
		this.emptyEventBuffer();
	}
}