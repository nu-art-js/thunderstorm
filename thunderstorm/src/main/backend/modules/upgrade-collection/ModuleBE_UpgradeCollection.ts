import {LogLevel, Module, Promise_all_sequentially} from '@nu-art/ts-common';
// import {ApiDefServer} from '../../utils/api-caller-types';
import {createBodyServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ApiDef_UpgradeCollection} from '../../../shared/upgrade-collection';
import {Storm} from '../../core/Storm';
import {ApiModule} from '../../../shared';
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
		]);
	}

	upgrade = async (body: { collectionsToUpgrade: string[] }) => {
		const toUpgrade = body.collectionsToUpgrade;
		const moduleToUpgrade = Storm.getInstance()
			.filterModules(module => toUpgrade.includes((module as unknown as ApiModule['dbModule']).dbDef?.dbName));
		await Promise_all_sequentially(moduleToUpgrade.map(module => (module as ModuleBE_BaseDBV3<any>).upgradeCollection));
	};
}

export const ModuleBE_UpgradeCollection = new ModuleBE_UpgradeCollection_Class();