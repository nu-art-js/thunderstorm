/*
 * @nu-art/permissions-backend - Rematerialize must coalesce inside one Mongo TX
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {generateHex} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {stormTester, type StormTestInput} from '@nu-art/storm-testalot';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {AccessScope_Self, type DatabaseDef_AccessGroup, type DatabaseDef_UserPermissions} from '@nu-art/permissions-shared';
import {DefaultStormTestConfig_Permissions} from './utils/helpers.js';
import {MemKey_UserAccessIds} from '../main/consts.js';
import {ModuleBE_AccessGroupDB} from '../main/_entity/access-group/ModuleBE_AccessGroupDB.js';
import {ModuleBE_UserPermissionsDB} from '../main/_entity/user-permissions/ModuleBE_UserPermissionsDB.js';
import {ModuleBE_Permissions, ServiceAccountId_Bootstrap} from '../main/modules/ModuleBE_Permissions.js';

const TEST_MONGO_DB = 'permissions-rematerialize-coalesce-test';
/** Matches bai-config.json files.tests.firebase.mongoPort when BAI has not injected MONGODB_EMULATOR_HOST. */
const DEFAULT_MONGO_PORT = 27019;

/** Production login path is Mongo — coalesce is a Mongo TX preClose invariant. */
ModuleBE_BaseDB.setDefaultBackend('mongo');
ModuleBE_BaseDB.setMongoDbName(TEST_MONGO_DB);

function resolveMongoUrl(): string {
	const host = process.env.MONGODB_EMULATOR_HOST ?? `localhost:${DEFAULT_MONGO_PORT}`;
	process.env.MONGODB_EMULATOR_HOST ??= host;
	return `mongodb://${host}`;
}

const StormTest_RematerializeCoalesce: StormTestInput = {
	modules: [
		ModuleBE_Firebase,
		...DefaultStormTestConfig_Permissions.modules,
	],
	config: {
		...DefaultStormTestConfig_Permissions.config,
		ModuleBE_Firebase: {
			mongo: {
				mongoUrl: resolveMongoUrl(),
				params: {
					directConnection: 'true',
					replicaSet: 'rs0',
				},
			},
		},
	},
};

describe('Permissions rematerialize TX coalesce', () => {
	it('one outer TX with two AccessGroup membership writes rematerializes UserPermissions once', async () => {
		await stormTester(StormTest_RematerializeCoalesce, async () => {
			await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
				await ModuleBE_Permissions.ensureDefinedGroups();

				const account = await ModuleBE_AccountDB.impl.create({
					email: `rematerialize-coalesce-${generateHex(8)}@test.local`,
					type: 'user',
				});
				await ModuleBE_Permissions.ensureAccountPermissionIdentity(account);

				const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
				const groupA = await ModuleBE_AccessGroupDB.create.item({
					_id: stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(generateHex(32)),
					type: 'custom',
					key: 'rematerialize-coalesce-a',
					label: 'Rematerialize coalesce A',
					members: [],
					scopeEntries: [],
				});
				const groupB = await ModuleBE_AccessGroupDB.create.item({
					_id: stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(generateHex(32)),
					type: 'custom',
					key: 'rematerialize-coalesce-b',
					label: 'Rematerialize coalesce B',
					members: [],
					scopeEntries: [],
				});

				const originalSetAll = ModuleBE_UserPermissionsDB.set.all.bind(ModuleBE_UserPermissionsDB.set);
				let rematerializeWrites = 0;
				(ModuleBE_UserPermissionsDB.set as {all: typeof originalSetAll}).all = (async (items) => {
					rematerializeWrites++;
					return originalSetAll(items);
				}) as typeof originalSetAll;

				try {
					await ModuleBE_AccessGroupDB.runTransaction(async () => {
						groupA.members = [personalGroupId];
						await ModuleBE_AccessGroupDB.set.item(groupA);
						groupB.members = [personalGroupId];
						await ModuleBE_AccessGroupDB.set.item(groupB);
					});
				} finally {
					(ModuleBE_UserPermissionsDB.set as {all: typeof originalSetAll}).all = originalSetAll;
				}

				// Bug today: each AccessGroup postWrite rematerializes immediately → 2 writes.
				// Fix: defer to TX preClose → 1 write.
				expect(rematerializeWrites).to.equal(1);
			});
		});
	});

	it('TX preClose rematerialize succeeds when outer SA MemKey_UserAccessIds was polluted to a non-admin account', async () => {
		await stormTester(StormTest_RematerializeCoalesce, async () => {
			await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
				await ModuleBE_Permissions.ensureDefinedGroups();

				const account = await ModuleBE_AccountDB.impl.create({
					email: `rematerialize-polluted-${generateHex(8)}@test.local`,
					type: 'user',
				});
				await ModuleBE_Permissions.ensureAccountPermissionIdentity(account);
				await ModuleBE_Permissions.recomputePermissionsForUsers([account._id]);

				const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
				const group = await ModuleBE_AccessGroupDB.create.item({
					_id: stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(generateHex(32)),
					type: 'custom',
					key: 'rematerialize-polluted-ctx',
					label: 'Rematerialize polluted context',
					members: [],
					scopeEntries: [],
				});

				// Simulate apex-register: stamp the new account's access ids into the enclosing SA context.
				MemKey_UserAccessIds.set({[AccessScope_Self]: [personalGroupId]});

				await ModuleBE_AccessGroupDB.runTransaction(async () => {
					// Group writes elevate (createAccessStructure); deferred preClose rematerialize
					// must still succeed even though the outer SA MemKey stays polluted.
					await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
						group.members = [personalGroupId];
						await ModuleBE_AccessGroupDB.set.item(group);
					});
				});

				const permissionsId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
				const userPerm = await ModuleBE_UserPermissionsDB.query.uniqueUnmanipulated(permissionsId);
				expect(userPerm).to.not.equal(undefined);
				expect(userPerm!.accessIds).to.be.an('object');
			});
		});
	});
});
