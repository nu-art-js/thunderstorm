import {ModuleBE_BaseApi_Class} from '@nu-art/db-api-backend';
import {CrudApiDef, stringToUniqueId} from '@nu-art/db-api-shared';
import {ApiHandler} from '@nu-art/http-server';
import type {QueryParams} from '@nu-art/api-types';
import {
	ApiDef_UserPermissions,
	DatabaseDef_UserPermissions,
	DBDef_UserPermissions,
	Response_MyPermissions,
} from '@nu-art/permissions-shared';
import {ModuleBE_UserPermissionsDB} from './ModuleBE_UserPermissionsDB.js';
import {SessionKey_Account_BE} from '@nu-art/user-account-backend';

class ModuleBE_UserPermissionsAPI_Class
	extends ModuleBE_BaseApi_Class<DatabaseDef_UserPermissions> {

	constructor() {
		super({
			dbModule: ModuleBE_UserPermissionsDB,
			crudApiDef: CrudApiDef<DatabaseDef_UserPermissions>(DBDef_UserPermissions.dbKey),
		});
	}

	@ApiHandler(ApiDef_UserPermissions.getMyPermissions)
	async getMyPermissions(_params: QueryParams): Promise<Response_MyPermissions> {
		const account = SessionKey_Account_BE.get();
		const permissionsId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
		const entity = await ModuleBE_UserPermissionsDB.query.unique(permissionsId);
		return {scopeEntries: entity?.scopeEntries ?? []};
	}
}

export const ModuleBE_UserPermissionsAPI = new ModuleBE_UserPermissionsAPI_Class();
