import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_Locale, DBDef_Locale} from '@nu-art/locale-shared';

export interface OnLocalesUpdated {
	__onLocalesUpdated: (...params: ApiCallerEventType<DatabaseDef_Locale['dbType']>) => void;
}

export const dispatch_onLocalesChanged = new ThunderDispatcher<OnLocalesUpdated, '__onLocalesUpdated'>('__onLocalesUpdated');

export class ModuleFE_Locale_Class
	extends ModuleFE_BaseApi<DatabaseDef_Locale> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Locale>(DBDef_Locale),
			crudApiDef: CrudApiDef<DatabaseDef_Locale>(DBDef_Locale.dbKey),
			dispatcher: (...args) => dispatch_onLocalesChanged.dispatchAll(...args),
		});
	}
}

export const ModuleFE_Locale = new ModuleFE_Locale_Class();
