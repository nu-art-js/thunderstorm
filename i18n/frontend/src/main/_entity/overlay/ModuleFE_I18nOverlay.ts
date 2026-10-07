import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_I18nOverlay, DBDef_I18nOverlay} from '@nu-art/i18n-shared';

export interface OnI18nOverlaysUpdated {
	__onI18nOverlaysUpdated: (...params: ApiCallerEventType<DatabaseDef_I18nOverlay['dbType']>) => void;
}

export const dispatch_onI18nOverlaysChanged = new ThunderDispatcher<OnI18nOverlaysUpdated, '__onI18nOverlaysUpdated'>('__onI18nOverlaysUpdated');

export class ModuleFE_I18nOverlay_Class
	extends ModuleFE_BaseApi<DatabaseDef_I18nOverlay> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_I18nOverlay>(DBDef_I18nOverlay),
			crudApiDef: CrudApiDef<DatabaseDef_I18nOverlay>(DBDef_I18nOverlay.dbKey),
			dispatcher: (...args) => dispatch_onI18nOverlaysChanged.dispatchAll(...args),
		});
	}
}

export const ModuleFE_I18nOverlay = new ModuleFE_I18nOverlay_Class();
