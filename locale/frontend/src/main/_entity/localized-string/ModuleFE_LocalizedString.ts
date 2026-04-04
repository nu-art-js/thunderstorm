import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_LocalizedString, DBDef_LocalizedString} from '@nu-art/locale-shared';

export interface OnLocalizedStringsUpdated {
	__onLocalizedStringsUpdated: (...params: ApiCallerEventType<DatabaseDef_LocalizedString['dbType']>) => void;
}

export const dispatch_onLocalizedStringsChanged = new ThunderDispatcher<OnLocalizedStringsUpdated, '__onLocalizedStringsUpdated'>('__onLocalizedStringsUpdated');

export class ModuleFE_LocalizedString_Class
	extends ModuleFE_BaseApi<DatabaseDef_LocalizedString> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_LocalizedString>(DBDef_LocalizedString),
			crudApiDef: CrudApiDef<DatabaseDef_LocalizedString>(DBDef_LocalizedString.dbKey),
			dispatcher: (...args) => dispatch_onLocalizedStringsChanged.dispatchAll(...args),
		});
	}
}

export const ModuleFE_LocalizedString = new ModuleFE_LocalizedString_Class();
