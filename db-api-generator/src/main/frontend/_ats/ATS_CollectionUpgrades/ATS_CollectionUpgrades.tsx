import * as React from 'react';
import {AppToolsScreen, ComponentSync, genericNotificationAction, LL_H_C, Thunder, TS_AppTools, TS_BusyButton} from '@nu-art/thunderstorm/frontend';
import {DB_Object, sortArray} from '@nu-art/ts-common';
import './ATS_CollectionUpgrades.scss';
import {BaseDB_ApiCaller} from '../..';

type State = {
	upgradableModules: BaseDB_ApiCaller<any, any>[];
};

export class ATS_CollectionUpgrades
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {name: 'Collection Upgrades', key: 'collection-upgrades', renderer: this, group: 'TS Dev Tools'};

	protected deriveStateFromProps(nextProps: {}) {
		const state = this.state ? {...this.state} : {} as State;
		state.upgradableModules ??= sortArray(Thunder.getInstance().filterModules(module => {
			const _module = module as BaseDB_ApiCaller<any, any>;
			return (!!_module.getCollectionName && !!_module.v1.upgradeCollection);
		}), i => i.getCollectionName());
		return state;
	}

	private upgradeCollection = async (collectionName: string, module: BaseDB_ApiCaller<DB_Object, any>) => {
		await genericNotificationAction(async () => {
			await module.v1.upgradeCollection({forceUpdate: true}).executeSync();
		}, `Upgrading ${collectionName}`);
	};

	render() {
		return <div className={'collection-upgrades-page'}>
			{TS_AppTools.renderPageHeader('Collection Upgrades')}
			<LL_H_C className={'buttons-container'}>
				{this.state.upgradableModules.map(module => {
					const name = module.getCollectionName().replace(/-/g, ' ');
					return <TS_BusyButton
						key={name}
						onClick={() => this.upgradeCollection(name, module)}
					>{name}</TS_BusyButton>;
				})}
			</LL_H_C>
		</div>;
	}
}