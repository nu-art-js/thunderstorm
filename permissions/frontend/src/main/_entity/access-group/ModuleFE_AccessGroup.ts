import {ModuleFE_BaseApi, buildConfigFromDBDef} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DBDef_AccessGroup, DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';

export interface OnAccessGroupUpdated {
	__onAccessGroupUpdated: (...params: ApiCallerEventType<DatabaseDef_AccessGroup['dbType']>) => void;
}

export const dispatch_onAccessGroupChanged = new ThunderDispatcher<OnAccessGroupUpdated, '__onAccessGroupUpdated'>('__onAccessGroupUpdated');

export class ModuleFE_AccessGroup_Class
	extends ModuleFE_BaseApi<DatabaseDef_AccessGroup> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_AccessGroup>(DBDef_AccessGroup),
			crudApiDef: CrudApiDef<DatabaseDef_AccessGroup>(DBDef_AccessGroup.dbKey),
			dispatcher: (...args) => dispatch_onAccessGroupChanged.dispatchAll(...args)
		});
	}
}

export const ModuleFE_AccessGroup = new ModuleFE_AccessGroup_Class();
