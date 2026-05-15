import {TS_Route} from '@nu-art/thunder-routing';
import {ModuleFE_PermissionsAssert} from '@nu-art/permissions-frontend';
import {PermissionScope_SamlProviderUI} from '@nu-art/saml-shared';
import {APage_SamlProviders} from './Page_SamlProviders.js';

export const Route_Page_SamlProviders: TS_Route = {
	path: 'saml-providers',
	key: 'saml-providers-page',
	enabled: () => ModuleFE_PermissionsAssert.hasScopeAccess(PermissionScope_SamlProviderUI, 'view'),
	Component: APage_SamlProviders,
};
