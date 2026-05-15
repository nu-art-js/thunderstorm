import {TS_Route} from '@nu-art/thunder-routing';
import {ModuleFE_PermissionsAssert} from '@nu-art/permissions-frontend';
import {PermissionScope_LocaleUI} from '@nu-art/locale-shared';
import {APage_Locales} from './Page_Locales.js';

export const Route_Page_Locales: TS_Route = {
	path: 'locales',
	key: 'locales-page',
	enabled: () => ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_LocaleUI, 'view'),
	Component: APage_Locales,
};
