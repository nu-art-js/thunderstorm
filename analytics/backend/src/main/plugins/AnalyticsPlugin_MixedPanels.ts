import {Analytics_UpdateLexicon, Analytics_UpdateUser, TSAnalyticsEvent} from '@nu-art/analytics-shared';
import {AnalyticsPlugin_Base} from './AnalyticsPlugin_Base.js';
import mixpanelLib, {Mixpanel, PropertyDict} from 'mixpanel';
import {_keys, BadImplementationException, exists, MissingDataException, TypedMap} from '@nu-art/ts-common';
import {AnalyticPanelConfig} from './types.js';

type MixedPanelsEventProperties = {
	distinct_id: string;
	time: number;
	// Optional metadata fields commonly used
	$session_id?: string;
	$groups?: TypedMap<string>
	// Any custom event-specific properties (typed later per event if needed)
	[key: string]: any;
};

type MixedPanelsEvent = {
	event: string;
	properties: MixedPanelsEventProperties;
}

type MixPanelsUserProps = {
	$first_name?: string;
	$last_name?: string;
	$name?: string;
	[key: string]: any;
}

type MixPanelsLexiconMap = {
	[groupKey: string]: {
		id: string;
		propDict: PropertyDict;
	}
}

export const pluginKey_MixedPanels = 'mixed-panels';

type MPConfig = AnalyticPanelConfig<{ mxConfig?: Partial<mixpanelLib.InitConfig> }>

export class AnalyticsPlugin_MixedPanels
	extends AnalyticsPlugin_Base<MixedPanelsEvent, MPConfig> {

	public readonly key = pluginKey_MixedPanels;
	private mixpanel: Mixpanel | undefined;

	init(config: MPConfig) {
		super.init(config);
		if (!config.token) {
			if (config.active)
				throw new MissingDataException(`Missing token for analytics plugin "${pluginKey_MixedPanels}"`);
			else return;
		}
		this.mixpanel = mixpanelLib.init(config.token, config.mxConfig);
	}

	//######################### Internal Logic #########################

	private prepareUserProps = (data: Analytics_UpdateUser['request']['userData']): MixPanelsUserProps => {
		const {userId, ...rest} = data;
		const props: MixPanelsUserProps = {};
		_keys(rest).forEach(key => {
			switch (key) {
				case 'firstName':
					props.$first_name = rest[key];
					break;
				case 'lastName':
					props.$last_name = rest[key];
					break;
				case 'displayName':
					props.$name = rest[key];
					break;
				default:
					props[key] = rest[key];
			}
		});
		return props;
	};

	private prepareLexiconMap = (data: Analytics_UpdateLexicon['request']['lexiconMap']): MixPanelsLexiconMap => {
		return _keys(data).reduce((map, groupKey) => {
			map[groupKey] = {
				id: data[groupKey].id,
				propDict: {$name: data[groupKey].label},
			};
			return map;
		}, {} as MixPanelsLexiconMap);
	};

	//######################### Implemented Logic #########################

	protected translateEvent(event: TSAnalyticsEvent): MixedPanelsEvent {
		return {
			event: event.key,
			properties: {
				distinct_id: event.userId ?? 'unknown',
				time: Math.floor(event.timestamp / 1000), //Mixed panels expects seconds
				...(exists(event.context) ? event.context : {}),
				...(exists(event.properties) ? event.properties : {}),
				...(exists(event.groups) ? event.groups : {}),
				...(exists(event.sessionId) ? {$session_id: event.sessionId} : {}),
			}
		};
	}

	protected sendEvents = async (events: MixedPanelsEvent[]) => {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling send before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		return new Promise<void>((resolve, reject) => {
			this.logDebug('Sending Events', events);
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

	protected updateUser_Impl = (mode: Analytics_UpdateUser['request']['mode'], data: Analytics_UpdateUser['request']['userData']) => {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling update user before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		return new Promise<void>((resolve, reject) => {
			this.logDebug('Updating user', data);
			const userProps = this.prepareUserProps(data);
			const cb = (err: Error | undefined) => {
				if (err) {
					this.logError(err);
					reject(err);
				} else {
					this.logDebug('Successfully updated user');
					resolve();
				}
			};

			switch (mode) {
				case 'set':
					this.mixpanel?.people.set(data.userId, userProps, cb);
					break;
				case 'set_once':
					this.mixpanel?.people.set_once(data.userId, userProps, cb);
					break;
				default:
					throw new BadImplementationException(`No Implementation for mode ${mode}`);
			}
		});
	};

	protected updateLexicon_Impl = (mode: Analytics_UpdateLexicon['request']['mode'], data: Analytics_UpdateLexicon['request']['lexiconMap']) => {
		if (!this.mixpanel)
			throw new BadImplementationException(`Calling update lexicon before analytics plugin ${pluginKey_MixedPanels} finished initializing`);

		return new Promise<void>((resolve, reject) => {
			const lexiconMap = this.prepareLexiconMap(data);
			this.logDebug('Updating Lexicon', lexiconMap);
			switch (mode) {
				case 'set': {
					const promises = _keys(lexiconMap)
						.map(groupKey => new Promise<void>((resolve, reject) => {
							this.mixpanel?.groups.set(groupKey as string, lexiconMap[groupKey].id, lexiconMap[groupKey].propDict, (err) => {
								if (err) {
									this.logError(err);
									reject(err);
								} else {
									this.logDebug('Successfully updated lexicon');
									resolve();
								}
							});
						}));
					Promise.all(promises)
						.then(() => resolve())
						.catch(err => {
							this.logError('Failed batch updating lexicon', err);
							reject();
						});
					break;
				}
				case 'set_once': {
					const promises = _keys(lexiconMap)
						.map(groupKey => new Promise<void>((resolve, reject) => {
							this.mixpanel?.groups.set_once(groupKey as string, lexiconMap[groupKey].id, lexiconMap[groupKey].propDict, (err) => {
								if (err) {
									this.logError(err);
									reject(err);
								} else {
									this.logDebug('Successfully updated lexicon');
									resolve();
								}
							});
						}));
					Promise.all(promises)
						.then(() => resolve())
						.catch(err => {
							this.logError('Failed batch updating lexicon', err);
							reject();
						});
					break;
				}
				default:
					throw new BadImplementationException(`No Implementation for mode ${mode}`);
			}
		});
	};
}