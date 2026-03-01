import {ApiCaller} from '@nu-art/http-client';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {EventDispatcher} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiDef_PermissionUser, DBDef_PermissionUser, DatabaseDef_PermissionUser, Request_AssignPermissions} from '@nu-art/permissions-shared';

export interface OnPermissionUserUpdated {
	__onPermissionUserUpdated: (...params: ApiCallerEventType<DatabaseDef_PermissionUser['dbType']>) => void;
}

export const dispatch_onPermissionUserChanged = new ThunderDispatcher<OnPermissionUserUpdated, '__onPermissionUserUpdated'>('__onPermissionUserUpdated');

type DB = DatabaseDef_PermissionUser['dbType'];
const uniqueKeys = (DBDef_PermissionUser.uniqueKeys ?? ['_id']) as DatabaseDef_PermissionUser['uniqueKeys'];
const baseConfig = {
	dbKey: DBDef_PermissionUser.dbKey,
	validator: DBDef_PermissionUser.modifiablePropsValidator,
	uniqueKeys,
	versions: DBDef_PermissionUser.versions,
	dbConfig: {
		name: DBDef_PermissionUser.frontend?.name ?? DBDef_PermissionUser.dbKey,
		group: DBDef_PermissionUser.frontend?.group ?? 'default',
		version: DBDef_PermissionUser.versions[0],
		uniqueKeys: uniqueKeys as (keyof DB)[]
	}
};

export class ModuleFE_PermissionUser_Class
	extends ModuleFE_BaseApi<DatabaseDef_PermissionUser> {

	constructor() {
		const dispatcher: EventDispatcher<DB> = (...args) => {
			dispatch_onPermissionUserChanged.dispatchUI(...args);
			dispatch_onPermissionUserChanged.dispatchModule(...args);
		};
		super({
			config: baseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_PermissionUser>(DBDef_PermissionUser.dbKey),
			dispatcher
		});
	}

	@ApiCaller(ApiDef_PermissionUser.assignPermissions)
	async assignPermissions(body: Request_AssignPermissions): Promise<void> {
		void body;
	}
}

export const ModuleFE_PermissionUser = new ModuleFE_PermissionUser_Class();
