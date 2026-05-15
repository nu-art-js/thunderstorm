import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_SamlProvider, DBDef_SamlProvider} from '@nu-art/saml-shared';

export interface OnSamlProvidersUpdated {
	__onSamlProvidersUpdated: (...params: ApiCallerEventType<DatabaseDef_SamlProvider['dbType']>) => void;
}

export const dispatch_onSamlProvidersChanged = new ThunderDispatcher<OnSamlProvidersUpdated, '__onSamlProvidersUpdated'>('__onSamlProvidersUpdated');

export class ModuleFE_SamlProviderDB_Class
	extends ModuleFE_BaseApi<DatabaseDef_SamlProvider> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_SamlProvider>(DBDef_SamlProvider),
			crudApiDef: CrudApiDef<DatabaseDef_SamlProvider>(DBDef_SamlProvider.dbKey),
			dispatcher: (...args) => dispatch_onSamlProvidersChanged.dispatchAll(...args),
		});
	}
}

export const ModuleFE_SamlProviderDB = new ModuleFE_SamlProviderDB_Class();
