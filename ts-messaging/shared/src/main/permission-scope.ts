import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Messaging = definePermissionScope('messaging', ['read', 'write', 'delete', 'admin'] as const);
