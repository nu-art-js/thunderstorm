import {ApiCallerEventTypeV2, BaseDB_ApiGeneratorCallerV2} from '@nu-art/db-api-generator/frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DB_Asset, DBDef_Assets} from '../../shared';


export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventTypeV2<DB_Asset>) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class ModuleFE_Assets_Class
	extends BaseDB_ApiGeneratorCallerV2<DB_Asset> {


	constructor() {
		super(DBDef_Assets,dispatch_onAssetsListChanged);
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
