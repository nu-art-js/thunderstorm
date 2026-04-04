import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_Locale = definePermissionScope('locale', ['read', 'write', 'admin'] as const);
