import {TS_Route} from '@nu-art/thunder-routing';
import {ModuleFE_PermissionsAssert} from '@nu-art/permissions-frontend';
import {PermissionScope_I18nUI} from '@nu-art/i18n-shared';
import {APage_Locales} from './Page_Locales.js';

export const Route_Page_Locales: TS_Route = {
	path: 'i18n',
	key: 'i18n-locales-page',
	enabled: () => ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_I18nUI, 'view'),
	Component: APage_Locales,
};
