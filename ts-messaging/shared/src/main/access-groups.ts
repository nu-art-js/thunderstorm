import {defineAccessGroup} from '@nu-art/permissions-shared';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';
import {
	PermissionScope_MessagingAdmin,
	PermissionScope_MessagingDelete,
	PermissionScope_MessagingRead,
	PermissionScope_MessagingWrite,
} from './permission-scope.js';

export const AccessGroup_MessagingRead = defineAccessGroup({
	key: 'messaging-read',
	label: 'Messaging Read',
	scopes: [{scope: PermissionScope_MessagingRead, value: 'read'}],
	memberKeys: ['messaging-admin'],
});

// Admin is not a member. Admin is not write. Delete is not a member either.
export const AccessGroup_MessagingWrite = defineAccessGroup({
	key: 'messaging-write',
	label: 'Messaging Write',
	scopes: [{scope: PermissionScope_MessagingWrite, value: 'write'}],
});

export const AccessGroup_MessagingDelete = defineAccessGroup({
	key: 'messaging-delete',
	label: 'Messaging Delete',
	scopes: [{scope: PermissionScope_MessagingDelete, value: 'delete'}],
	memberKeys: ['messaging-admin'],
});

export const AccessGroup_MessagingAdmin = defineAccessGroup({
	key: 'messaging-admin',
	label: 'Messaging Admin',
	scopes: [{scope: PermissionScope_MessagingAdmin, value: 'admin'}],
});

export const MessagingReadGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-read');
export const MessagingWriteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-write');
export const MessagingDeleteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-delete');
export const MessagingAdminGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-admin');
