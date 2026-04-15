import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_LocalizedString, DBDef_LocalizedString} from '@nu-art/locale-shared';

export class ModuleBE_LocalizedStringDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_LocalizedString> {

	constructor() {
		super(DBDef_LocalizedString);
	}
}

export const ModuleBE_LocalizedStringDB = new ModuleBE_LocalizedStringDB_Class();
