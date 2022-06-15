import {ApiCallerEventType, BaseDB_ApiGeneratorCaller, getModuleFEConfig} from '@nu-art/db-api-generator/frontend';

import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DB_Asset, DBDef_Assets} from '../../shared';


export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventType) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class ModuleFE_Assets_Class
	extends BaseDB_ApiGeneratorCaller<DB_Asset> {

	constructor() {
		super(getModuleFEConfig(DBDef_Assets));
		this.setDefaultDispatcher(dispatch_onAssetsListChanged);
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
