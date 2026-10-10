import {ModuleBE_Permissions} from '@nu-art/permissions-backend';
import {i18nLocaleAccess} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';
import {ModuleBE_LocaleDB} from './_entity/locale/ModuleBE_LocaleDB.js';

/**
 * Per-locale ACL: locale documents and their overrides are minted with that locale's four groups
 * (readers, writers=creators, deleters, owners). Call once at app backend init.
 */
export function wireI18nDocumentAccess() {
	ModuleBE_Permissions.setAccessContextResolver(ModuleBE_LocaleDB, item => i18nLocaleAccess(item.code));
	ModuleBE_Permissions.setAccessContextResolver(ModuleBE_I18nOverlayDB, item => i18nLocaleAccess(item.locale));
}
