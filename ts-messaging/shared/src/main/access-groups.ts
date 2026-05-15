import {defineAccessGroup} from '@nu-art/permissions-shared';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';
import {PermissionScope_Messaging} from './permission-scope.js';

const MessagingScopeKey = 'messaging';

export const AccessGroup_MessagingRead = defineAccessGroup({
	key: 'messaging-read',
	label: 'Messaging Read',
	scopeKey: MessagingScopeKey,
	scopes: [{scope: PermissionScope_Messaging, value: 'read'}],
	memberKeys: ['messaging-admin'],
});

export const AccessGroup_MessagingWrite = defineAccessGroup({
	key: 'messaging-write',
	label: 'Messaging Write',
	scopeKey: MessagingScopeKey,
	scopes: [{scope: PermissionScope_Messaging, value: 'write'}],
	memberKeys: ['messaging-admin'],
});

export const AccessGroup_MessagingDelete = defineAccessGroup({
	key: 'messaging-delete',
	label: 'Messaging Delete',
	scopeKey: MessagingScopeKey,
	scopes: [{scope: PermissionScope_Messaging, value: 'delete'}],
	memberKeys: ['messaging-admin'],
});

export const AccessGroup_MessagingAdmin = defineAccessGroup({
	key: 'messaging-admin',
	label: 'Messaging Admin',
	scopeKey: MessagingScopeKey,
	scopes: [{scope: PermissionScope_Messaging, value: 'admin'}],
});

export const MessagingReadGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-read');
export const MessagingWriteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-write');
export const MessagingDeleteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/messaging-delete');
