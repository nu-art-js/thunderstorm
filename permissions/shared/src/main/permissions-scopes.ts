import {definePermissionScope} from './_entity/permission-scope/brand.js';

export const PermissionScope_Permissions = definePermissionScope('permissions', ['read', 'write', 'admin'] as const);
