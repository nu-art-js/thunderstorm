import * as React from 'react';
import {filterDuplicates, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_CollectionUpgrades.scss';
import {AppToolsScreen, ATS_Backend, TS_AppTools} from '../TS_AppTools/index.js';
import {Button, ComponentSync, LL_H_C} from '@nu-art/thunder-widgets';
import {genericNotificationAction} from '@nu-art/thunder-notifications';
import {ModuleFE_BaseApi, ModuleFE_BaseDB} from '@nu-art/db-api-frontend';
import {ModuleFE_CollectionActions} from '@nu-art/db-api-frontend';


type State = {
	upgradableModules: ModuleFE_BaseApi<any>[];
};

export class ATS_CollectionUpgrades
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Collection Upgrades',
		key: 'collection-upgrades',
		renderer: this,
		group: ATS_Backend,
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.upgradableModules ??= sortArray(filterDuplicates(RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
			return !!module.getCollectionName;
		}), (module: ModuleFE_BaseApi<any>) => module.getCollectionName()), item => item.getCollectionName());

		return state;
	}

	__onSyncStatusChanged(module: ModuleFE_BaseDB<any>) {
		this.forceUpdate();
	}

	private upgradeCollection = async (collectionName: string, module: ModuleFE_BaseApi<any>, e: React.MouseEvent) => {
		await genericNotificationAction(async () => {
			await ModuleFE_CollectionActions.upgrade.collections({
				dbKeys: [module.getCollectionKey()],
				force: e.metaKey,
			});
		}, `Upgrading ${collectionName}`);
	};

	private upgradeAll = async (e: React.MouseEvent<HTMLButtonElement>) => {
		await genericNotificationAction(async () => {
			await ModuleFE_CollectionActions.upgrade.all({force: e.metaKey});
		}, `Upgrading all collections`);
	};

	render() {
		return <div className={'collection-upgrades-page'}>
			<Button onClick={e => this.upgradeAll(e)}>Upgrade All</Button>
			{TS_AppTools.renderPageHeader('Collection Upgrades - To force upgrade click + ⌘/ctrl')}
			<LL_H_C className={'buttons-container'}>
				{(this.state.upgradableModules || []).map(module => {
					const name = module.getCollectionName().replace(/-/g, ' ');
					return <Button
						key={name + module.cache.all().length}
						onClick={(e) => this.upgradeCollection(name, module, e)}
					>{name} ({module.cache.all().length})</Button>;
				})}
			</LL_H_C>
		</div>;
	}
}