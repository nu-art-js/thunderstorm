import {definePermissionScope} from './_entity/permission-scope/brand.js';

export const PermissionScope_PermissionsUI = definePermissionScope('permissions-ui', ['view'] as const);
export const PermissionScope_AccessGroup = definePermissionScope('access-group', ['create'] as const);
