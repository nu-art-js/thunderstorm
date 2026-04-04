import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_Locale, DBDef_Locale} from '@nu-art/locale-shared';

export class ModuleBE_LocaleDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Locale> {

	constructor() {
		super(DBDef_Locale);
	}
}

export const ModuleBE_LocaleDB = new ModuleBE_LocaleDB_Class();
