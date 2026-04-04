import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_LocalizedString, DBDef_LocalizedString, PermissionScope_Locale} from '@nu-art/locale-shared';
import {wireScopePermission} from '@nu-art/permissions-backend';

export class ModuleBE_LocalizedStringDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_LocalizedString> {

	constructor() {
		super(DBDef_LocalizedString);
	}

	init() {
		super.init();
		wireScopePermission(this, PermissionScope_Locale, 'write');
	}
}

export const ModuleBE_LocalizedStringDB = new ModuleBE_LocalizedStringDB_Class();
