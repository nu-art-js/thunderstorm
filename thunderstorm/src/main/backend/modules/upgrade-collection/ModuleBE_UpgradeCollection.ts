import {LogLevel, Module, Promise_all_sequentially, RuntimeModules} from '@nu-art/ts-common';
// import {ApiDefServer} from '../../utils/api-caller-types';
import {createBodyServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ApiDef_UpgradeCollection} from '../../../shared/upgrade-collection';
import {ApiModule} from '../../../shared';
import {ModuleBE_BaseApiV3_Class} from '../db-api-gen/ModuleBE_BaseApiV3';


export class ModuleBE_UpgradeCollection_Class
	extends Module {

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
	}

	protected init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_UpgradeCollection.vv1.upgrade, this.upgrade),
		]);
	}

	upgrade = async (body: { collectionsToUpgrade: string[] }) => {
		const toUpgrade = body.collectionsToUpgrade;
		const moduleToUpgrade = RuntimeModules()
			.filter<ModuleBE_BaseApiV3_Class<any>>((module: ApiModule) => !!module.dbModule?.dbDef?.dbName && toUpgrade.includes(module.dbModule?.dbDef?.dbName));
		await Promise_all_sequentially(moduleToUpgrade.map(module => module.dbModule.upgradeCollection));
	};
}

export const ModuleBE_UpgradeCollection = new ModuleBE_UpgradeCollection_Class();