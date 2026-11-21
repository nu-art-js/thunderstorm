import {definePermissionScope} from '@nu-art/permissions-shared';

// Separate keys. A held right does not satisfy a different right.
export const PermissionScope_MessagingRead = definePermissionScope('messaging-read', ['read'] as const);
export const PermissionScope_MessagingWrite = definePermissionScope('messaging-write', ['write'] as const);
export const PermissionScope_MessagingDelete = definePermissionScope('messaging-delete', ['delete'] as const);
export const PermissionScope_MessagingAdmin = definePermissionScope('messaging-admin', ['admin'] as const);
