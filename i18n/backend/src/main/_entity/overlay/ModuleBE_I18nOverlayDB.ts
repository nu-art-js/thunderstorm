import {hashToUniqueId} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_I18nOverlay, DBDef_I18nOverlay, I18nOverlay_DbKey} from '@nu-art/i18n-shared';

export class ModuleBE_I18nOverlayDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_I18nOverlay> {

	constructor() {
		super(DBDef_I18nOverlay);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_I18nOverlay['uiType'], _originalDbInstance: DatabaseDef_I18nOverlay['dbType']) {
		if (!dbInstance._id)
			dbInstance._id = hashToUniqueId<typeof I18nOverlay_DbKey>(`${dbInstance.key}:${dbInstance.localeId}`);
	}
}

export const ModuleBE_I18nOverlayDB = new ModuleBE_I18nOverlayDB_Class();
