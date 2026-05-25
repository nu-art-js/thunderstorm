import {definePermissionScope} from '@nu-art/permissions-shared';

export const PermissionScope_BootstrapToken = definePermissionScope('bootstrap-token', ['create'] as const);
