import * as React from 'react';
import {
	AppToolsScreen,
	genericNotificationAction,
	LL_H_C,
	Thunder,
	TS_AppTools,
	TS_BusyButton
} from '@nu-art/thunderstorm/frontend';
import {DB_Object, Minute, sortArray} from '@nu-art/ts-common';
import './ATS_CollectionUpgrades.scss';
import {ModuleFE_BaseApi} from '../../modules/ModuleFE_BaseApi';
import {SmartComponent, State_SmartComponent} from '../../components/SmartComponent';


type State = {
	upgradableModules: ModuleFE_BaseApi<any, any>[];
};

export class ATS_CollectionUpgrades
	extends SmartComponent<{}, State> {

	static defaultProps = {
		modules: () => Thunder.getInstance().filterModules(module => (module as unknown as {
			ModuleFE_BaseDB: boolean
		}).ModuleFE_BaseDB)
	}

	static screen: AppToolsScreen = {
		name: 'Collection Upgrades',
		key: 'collection-upgrades',
		renderer: this,
		group: 'TS Dev Tools'
	};

	protected async deriveStateFromProps(nextProps: {}, state: State & State_SmartComponent) {
		state.upgradableModules ??= sortArray(Thunder.getInstance().filterModules(module => {
			const _module = module as ModuleFE_BaseApi<any, any>;
			return (!!_module.getCollectionName && !!_module.v1.upgradeCollection);
		}), i => i.getCollectionName());
		return state;
	}

	private upgradeCollection = async (collectionName: string, module: ModuleFE_BaseApi<DB_Object, any>) => {
		await genericNotificationAction(async () => {
			await module.v1.upgradeCollection({forceUpdate: true}).setTimeout(5 * Minute).executeSync();
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
					>{name} ({module.cache.all().length})</TS_BusyButton>;
				})}
			</LL_H_C>
		</div>;
	}
}