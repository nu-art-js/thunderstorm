/*
 * @nu-art/permissions-backend - Pure unit tests for the developer admin scope
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {definePermissionScope, PermissionScope_Developer, permissionScopeId} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionsAssert} from '../main/modules/ModuleBE_PermissionsAssert.js';
import {MemKey_UserScopePermissions} from '../main/consts.js';
import {
	developerAdminGroupIds,
	developerRunActionsScopeId,
	groupsMissingDeveloperRunActions,
	permissionsAdminScopeEntries,
	scopeEntriesForDefinedGroup,
	shouldStampDeveloperAdminGroups,
} from '../main/developer-admin-scope.js';

const Scope_Messaging = definePermissionScope('developer-admin-scope-messaging', ['read', 'admin'] as const);
const runId = developerRunActionsScopeId();

describe('developer admin scope', () => {
	it('orders view below run-actions', () => {
		expect(PermissionScope_Developer.values).to.deep.equal(['view', 'run-actions']);
		expect(PermissionScope_Developer.values.indexOf('view')).to.be.lessThan(PermissionScope_Developer.values.indexOf('run-actions'));
	});

	it('grants view to a caller that holds run-actions', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['developer:run-actions']);
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Developer, 'view');
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Developer, 'run-actions');
		});
	});

	it('rejects run-actions when the caller holds only view', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['developer:view']);
			ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Developer, 'view');
			try {
				ModuleBE_PermissionsAssert.assertScopePermission(PermissionScope_Developer, 'run-actions');
				expect.fail('expected 403');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('puts run-actions on Permissions Admin and not the view value', () => {
		const entries = permissionsAdminScopeEntries();
		expect(entries).to.include(runId);
		expect(entries).to.not.include(permissionScopeId(PermissionScope_Developer.key, 'view'));
		expect(entries).to.include(permissionScopeId('permissions-ui', 'view'));
		expect(entries).to.include(permissionScopeId('access-group', 'create'));
		expect(entries).to.include(permissionScopeId('service-account', 'run'));
	});

	it('selects admin groups by definition key, including a group stored under a short key', () => {
		const ids = developerAdminGroupIds([
			{key: 'messaging-admin'},
			{key: 'messaging-read'},
			{key: 'permissions-admin'},
		]);
		expect(ids).to.include(hashToUniqueId('group/permissions-admin'));
		expect(ids).to.include(hashToUniqueId('group/org-apex-admin'));
		expect(ids).to.include(hashToUniqueId('group/messaging-admin'));
		expect(ids).to.not.include(hashToUniqueId('group/messaging-read'));
		expect(ids.filter(id => id === hashToUniqueId('group/permissions-admin'))).to.have.length(1);
	});

	it('adds run-actions to an admin group definition and leaves a reader group unchanged', () => {
		const adminEntries = scopeEntriesForDefinedGroup({
			key: 'messaging-admin',
			scopes: [{scope: Scope_Messaging, value: 'admin'}],
		});
		const readerEntries = scopeEntriesForDefinedGroup({
			key: 'messaging-read',
			scopes: [{scope: Scope_Messaging, value: 'read'}],
		});
		expect(adminEntries).to.include(permissionScopeId(Scope_Messaging.key, 'admin'));
		expect(adminEntries).to.include(runId);
		expect(readerEntries).to.deep.equal([permissionScopeId(Scope_Messaging.key, 'read')]);
	});

	it('does not stamp when Permissions Admin is missing or already holds run-actions', () => {
		expect(shouldStampDeveloperAdminGroups(undefined, runId)).to.equal(false);
		expect(shouldStampDeveloperAdminGroups({scopeEntries: [runId]}, runId)).to.equal(false);
		expect(shouldStampDeveloperAdminGroups({scopeEntries: []}, runId)).to.equal(true);
		expect(shouldStampDeveloperAdminGroups({}, runId)).to.equal(true);
	});

	it('patches an admin group that is stored under a short key and skips one that already has the scope', () => {
		const messagingAdminId = hashToUniqueId('group/messaging-admin');
		const readerId = hashToUniqueId('group/messaging-read');
		const adminIds = new Set(developerAdminGroupIds([{key: 'messaging-admin'}]));
		const dirty = groupsMissingDeveloperRunActions([
			{_id: messagingAdminId, key: 'messaging', scopeEntries: []},
			{_id: hashToUniqueId('group/permissions-admin'), key: 'permissions-admin', scopeEntries: [runId]},
			{_id: readerId, key: 'messaging-read', scopeEntries: []},
		], adminIds, runId);
		expect(dirty.map(group => group._id)).to.deep.equal([messagingAdminId]);
	});
});
