import {GroupId_AppDefault, ModuleBE_Permissions} from '@nu-art/permissions-backend';
import {i18nOverrideWriterIds} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB} from './_entity/overlay/ModuleBE_I18nOverlayDB.js';

/**
 * Per-locale ACL: every account (app Default group) reads an override document; only its locale's
 * translator group and the i18n admins write, create and delete it. Call once at app backend init.
 */
export function wireI18nDocumentAccess() {
	ModuleBE_Permissions.setAccessContextResolver(ModuleBE_I18nOverlayDB, item => {
		const writers = i18nOverrideWriterIds(item.locale);
		return {__access: {readers: [GroupId_AppDefault, ...writers], writers, creators: writers, deleters: writers, owners: []}};
	});
}
