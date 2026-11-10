import {definePermissionScope} from './_entity/permission-scope/brand.js';

export const PermissionScope_PermissionsUI = definePermissionScope('permissions-ui', ['view'] as const);
export const PermissionScope_AccessGroup = definePermissionScope('access-group', ['create'] as const);
/** View opens the dev-tool screen. run-actions also satisfies view. */
export const PermissionScope_Developer = definePermissionScope('developer', ['view', 'run-actions'] as const);
/** Allows elevating to system-only service accounts (e.g. bootstrap-admin) from a user request context. */
export const PermissionScope_ServiceAccount = definePermissionScope('service-account', ['run'] as const);
