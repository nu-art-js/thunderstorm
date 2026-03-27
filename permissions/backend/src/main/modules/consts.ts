import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Permissions = definePermissionScope('permissions', ['read', 'write', 'admin'] as const);
