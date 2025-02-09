import * as React from 'react';
import {__stringify, filterDuplicates, Minute, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_CollectionUpgrades.scss';
import {AppToolsScreen, ATS_Backend, TS_AppTools} from '../../components/TS_AppTools';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {LL_H_C} from '../../components/Layouts';
import {ModuleFE_UpgradeCollection} from '../../modules/upgrade-collection/ModuleFE_UpgradeCollection';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ComponentSync} from '../../core/ComponentSync';
import {Button} from '../../components/Button/Button';


type State = {
	upgradableModules: ModuleFE_BaseApi<any, any>[];
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

	__onSyncStatusChanged(module: ModuleFE_BaseDB<any, any>) {
		this.forceUpdate();
	}

	private upgradeCollection = async (collectionName: string, module: ModuleFE_BaseApi<any, any>, e: React.MouseEvent) => {
		await genericNotificationAction(async () => {
			await ModuleFE_UpgradeCollection.vv1.upgrade({
				collectionsToUpgrade: [module.dbDef.dbKey],
				force: e.metaKey
			}).setTimeout(5 * Minute).executeSync();
		}, `Upgrading ${collectionName}`);
	};

	private upgradeAll = async (collectionNames?: string[]) => {
		await genericNotificationAction(async () => {
			await ModuleFE_UpgradeCollection.vv1.upgradeAll({collectionsToUpgrade: collectionNames ?? []}).setTimeout(5 * Minute).executeSync();
		}, `Upgrading ${collectionNames?.length ? __stringify(collectionNames) : 'all'}`);
	};

	render() {
		return <div className={'collection-upgrades-page'}>
			<Button key={'upgrade-all-test'} onClick={() => this.upgradeAll()}>Upgrade All</Button>
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