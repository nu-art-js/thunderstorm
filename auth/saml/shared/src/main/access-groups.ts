import {defineAccessGroup} from '@nu-art/permissions-shared';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';
import {PermissionScope_SamlProvider, PermissionScope_SamlProviderUI} from './permission-scope.js';

const SamlScopeKey = 'saml';

export const AccessGroup_SamlRead = defineAccessGroup({
	key: 'saml-read',
	label: 'SAML Read',
	scopeKey: SamlScopeKey,
	scopes: [{scope: PermissionScope_SamlProviderUI, value: 'view'}],
	memberKeys: ['saml-admin'],
});

export const AccessGroup_SamlWrite = defineAccessGroup({
	key: 'saml-write',
	label: 'SAML Write',
	scopeKey: SamlScopeKey,
	scopes: [{scope: PermissionScope_SamlProvider, value: 'create'}],
	memberKeys: ['saml-admin'],
});

export const AccessGroup_SamlDelete = defineAccessGroup({
	key: 'saml-delete',
	label: 'SAML Delete',
	scopeKey: SamlScopeKey,
	scopes: [],
	memberKeys: ['saml-admin'],
});

export const AccessGroup_SamlAdmin = defineAccessGroup({
	key: 'saml-admin',
	label: 'SAML Admin',
	scopeKey: SamlScopeKey,
	scopes: [],
});

export const SamlReadGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/saml-read');
export const SamlWriteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/saml-write');
export const SamlDeleteGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/saml-delete');
export const SamlAdminGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/saml-admin');
