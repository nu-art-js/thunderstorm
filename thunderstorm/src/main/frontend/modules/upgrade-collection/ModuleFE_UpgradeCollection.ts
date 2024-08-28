import {Module} from '@thunder-storm/common';
import {ApiDefCaller} from '../../shared';
import {apiWithBody} from '../../core/typed-api';
import {ApiDef_UpgradeCollection, ApiStruct_UpgradeCollection} from '../../../shared/upgrade-collection';


class ModuleFE_UpgradeCollection_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_UpgradeCollection>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			upgrade: apiWithBody(ApiDef_UpgradeCollection.vv1.upgrade),
			upgradeAll: apiWithBody(ApiDef_UpgradeCollection.vv1.upgradeAll),
		};
	}
}

export const ModuleFE_UpgradeCollection = new ModuleFE_UpgradeCollection_Class();