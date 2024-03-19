import {__stringify, LogLevel, Module, Promise_all_sequentially, RuntimeModules} from '@nu-art/ts-common';
import {createBodyServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ApiDef_UpgradeCollection, Request_UpgradeCollections} from '../../../shared/upgrade-collection';
import {ApiModule} from '../../../shared';
import {ModuleBE_BaseApiV3_Class} from '../db-api-gen/ModuleBE_BaseApiV3';
import {ModuleBE_BaseDBV3} from '../db-api-gen/ModuleBE_BaseDBV3';


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
			createBodyServerApi(ApiDef_UpgradeCollection.vv1.upgradeAll, this.upgradeAll),
		]);
	}

	upgradeAll = async (body: Request_UpgradeCollections) => {
		this.logInfo('upgrade-all');
		const filterModules = (module: any) => body.collectionsToUpgrade.length > 0 ? body.collectionsToUpgrade.includes(module.dbModule?.dbDef?.dbKey) : true;

		const allCollectionModulesToCheck = RuntimeModules().filter<ModuleBE_BaseApiV3_Class<any>>((module: ApiModule) =>
			!!module.dbModule?.dbDef?.dbKey
			&& !(module.dbModule as { advisorCollectionModule: boolean }).advisorCollectionModule
			&& filterModules(module));
		this.logWarningBold(`Modules to check and upgrade: ${__stringify(allCollectionModulesToCheck.map(module => module.dbModule.dbDef.dbKey))}`);
		await Promise_all_sequentially(allCollectionModulesToCheck.map(module => () => this.upgradeModuleIfNecessary(module.dbModule)));
	};

	upgradeModuleIfNecessary = async (dbModule: ModuleBE_BaseDBV3<any>) => {
		if (!(await dbModule.isCollectionUpToDate()))
			await dbModule.upgradeCollection();
	};

	upgrade = async (body: Request_UpgradeCollections) => {
		const toUpgrade = body.collectionsToUpgrade;
		const moduleToUpgrade = RuntimeModules()
			.filter<ModuleBE_BaseApiV3_Class<any>>((module: ApiModule) => !!module.dbModule?.dbDef?.dbKey && toUpgrade.includes(module.dbModule?.dbDef?.dbKey));
		await Promise_all_sequentially(moduleToUpgrade.map(module => module.dbModule.upgradeCollection));
	};
}

export const ModuleBE_UpgradeCollection = new ModuleBE_UpgradeCollection_Class();