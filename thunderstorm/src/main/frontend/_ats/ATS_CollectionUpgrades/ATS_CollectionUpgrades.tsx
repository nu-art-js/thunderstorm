import * as React from 'react';
import {DB_Object, Minute, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_CollectionUpgrades.scss';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ComponentStatus, Props_SmartComponent, SmartComponent, State_SmartComponent} from '../../core/SmartComponent';
import {AppToolsScreen, ATS_Backend, TS_AppTools} from '../../components/TS_AppTools';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {LL_H_C} from '../../components/Layouts';
import {TS_BusyButton} from '../../components/TS_BusyButton';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import {ModuleFE_UpgradeCollection} from '../../modules/upgrade-collection/ModuleFE_UpgradeCollection';


type State = {
	upgradableModules: ModuleFE_BaseApi<any, any>[];
};

export class ATS_CollectionUpgrades
	extends SmartComponent<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Collection Upgrades',
		key: 'collection-upgrades',
		renderer: this,
		group: ATS_Backend
	};

	protected async deriveStateFromProps(nextProps: {}, state: State & State_SmartComponent) {
		state.upgradableModules ??= sortArray(RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
			return !!module.getCollectionName;
		}), item => item.getCollectionName());

		state.componentPhase = ComponentStatus.Synced;
		return state;
	}

	protected createInitialState(nextProps: Props_SmartComponent) {
		const initialState = super.createInitialState(nextProps);
		initialState.componentPhase = ComponentStatus.Synced;
		return initialState;
	}

	__onSyncStatusChanged(module: ModuleFE_BaseDB<DB_Object, any>) {
		this.forceUpdate();
	}

	private upgradeCollection = async (collectionName: string, module: ModuleFE_BaseApi<DB_Object, any>) => {
		await genericNotificationAction(async () => {
			await ModuleFE_UpgradeCollection.vv1.upgrade({collectionsToUpgrade: [module.dbDef.dbName]}).setTimeout(5 * Minute).executeSync();
		}, `Upgrading ${collectionName}`);
	};

	render() {
		return <div className={'collection-upgrades-page'}>
			{TS_AppTools.renderPageHeader('Collection Upgrades')}
			<LL_H_C className={'buttons-container'}>
				{(this.state.upgradableModules || []).map(module => {
					const name = module.getCollectionName().replace(/-/g, ' ');
					return <TS_BusyButton
						key={name + module.cache.all().length}
						onClick={() => this.upgradeCollection(name, module)}
					>{name} ({module.cache.all().length})</TS_BusyButton>;
				})}
			</LL_H_C>
		</div>;
	}
}