import {hashToUniqueId} from '@nu-art/db-api-shared';
import {defineAccessGroup, permissionScopeId, type DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';
import {PermissionScope_I18nEdit, PermissionScope_I18nLocale, PermissionScope_I18nOverlay, PermissionScope_I18nUI} from './permission-scope.js';

export const I18nScopeKey = 'i18n';

/** Edits every locale and manages locales. */
export const AccessGroup_I18nAdmin = defineAccessGroup({
	key: 'i18n-admin',
	label: 'i18n Admin',
	scopeKey: I18nScopeKey,
	scopes: [
		{scope: PermissionScope_I18nUI, value: 'view'},
		{scope: PermissionScope_I18nLocale, value: 'create'},
		{scope: PermissionScope_I18nOverlay, value: 'create'},
		{scope: PermissionScope_I18nEdit, value: 'edit'},
	],
});

export const I18nAdminGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`group/${AccessGroup_I18nAdmin.key}`);

/**
 * ACL bucket per locale: one access group per locale code, created with the locale. Its members may
 * edit that locale's overrides only (document access), and get the scopes needed to edit.
 */
export const i18nTranslatorGroupKey = (locale: string) => `i18n-translator--${locale}`;
export const i18nTranslatorGroupId = (locale: string) => hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`group/${i18nTranslatorGroupKey(locale)}`);

/** Scope entries a locale translator group grants. */
export const I18nTranslatorScopeEntryIds = [
	permissionScopeId(PermissionScope_I18nUI.key, 'view'),
	permissionScopeId(PermissionScope_I18nOverlay.key, 'create'),
	permissionScopeId(PermissionScope_I18nEdit.key, 'edit'),
];

/** Who may create, write and delete a locale's override documents: that locale's bucket and the admins. */
export const i18nOverrideWriterIds = (locale: string) => [i18nTranslatorGroupId(locale), I18nAdminGroupId];
