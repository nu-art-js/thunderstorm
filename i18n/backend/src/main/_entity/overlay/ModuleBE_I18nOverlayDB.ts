import {hashToUniqueId} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {canCreateForLocaleId, DatabaseDef_I18nOverlay, DBDef_I18nOverlay, I18nOverlay_DbKey, PermissionScope_I18nOverlay} from '@nu-art/i18n-shared';
import {HttpCodes} from '@nu-art/api-types';
import {MemKey_UserAccessIds, MemKey_UserScopePermissions, ModuleBE_PermissionsAssert} from '@nu-art/permissions-backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';

/**
 * Absence of these keys means there is no caller context. The document-access interceptor skips the
 * same case via MemKey_UserAccessIds.peak(); system writes (no context) are not a caller create.
 */
const callerScopes = (): string[] | undefined => MemStorage.getStore() ? MemKey_UserScopePermissions.peak() : undefined;

const callerAccessIds = (): string[] | undefined => {
	if (!MemStorage.getStore())
		return undefined;

	const accessIds = MemKey_UserAccessIds.peak();
	if (!accessIds)
		return undefined;

	return Object.values(accessIds).flat();
};

export class ModuleBE_I18nOverlayDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_I18nOverlay> {

	constructor() {
		super(DBDef_I18nOverlay);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_I18nOverlay['uiType'], originalDbInstance: DatabaseDef_I18nOverlay['dbType']) {
		if (!dbInstance._id)
			dbInstance._id = hashToUniqueId<typeof I18nOverlay_DbKey>(`${dbInstance.key}:${dbInstance.localeId}`);

		// Callers with a permission context need the overlay scope. Updates and deletes are also checked
		// by document access (writers/deleters). Creation is not (the resolver stamps __access without
		// checking creators), so membership of the locale's writers group is asserted here.
		if (callerScopes())
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_I18nOverlay, 'create');

		const accessIds = callerAccessIds();
		if (!originalDbInstance && accessIds && !canCreateForLocaleId(accessIds, dbInstance.localeId))
			throw HttpCodes._4XX.FORBIDDEN('No translator access to this locale', `Caller is not in the writers group of locale '${dbInstance.localeId}'`);
	}
}

export const ModuleBE_I18nOverlayDB = new ModuleBE_I18nOverlayDB_Class();
