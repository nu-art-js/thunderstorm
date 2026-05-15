import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_SamlProviderUI = definePermissionScope('saml-provider-ui', ['view'] as const);
export const PermissionScope_SamlProvider = definePermissionScope('saml-provider', ['create'] as const);
