import {TS_Route} from '@nu-art/thunder-routing';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert.js';
import {PermissionScope_PermissionsUI} from '@nu-art/permissions-shared';
import {APage_Permissions} from './Page_Permissions.js';

export const Route_Page_Permissions: TS_Route = {
	path: 'permissions',
	key: 'permissions-page',
	enabled: () => ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_PermissionsUI, 'view'),
	Component: APage_Permissions,
};
