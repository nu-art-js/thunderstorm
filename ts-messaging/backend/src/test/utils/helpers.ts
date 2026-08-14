/*
 * @nu-art/ts-messaging-backend - Firebase test helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException, generateHex} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import type {StormTestInput} from '@nu-art/storm-testalot';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {MemKey_AccountId, MemKey_SessionData, ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import type {DB_Account, UI_SessionAccount} from '@nu-art/user-account-shared';
import {MemKey_UserAccessIds, MemKey_UserScopePermissions, ModuleBE_Permissions, ModuleBE_UserPermissionsDB, ModulePackBE_Permissions, ServiceAccountId_Bootstrap} from '@nu-art/permissions-backend';
import type {DatabaseDef_UserPermissions} from '@nu-art/permissions-shared';
import {ModulePackBE_Messaging} from '../../main/module-pack.js';
import {ModuleBE_TopicDB} from '../../main/ModuleBE_TopicDB.js';

const TEST_MONGO_DB = 'ts-messaging-acl-test';
const DEFAULT_MONGO_PORT = 27019;

function resolveMongoUrl(): string {
	const host = process.env.MONGODB_EMULATOR_HOST ?? `localhost:${DEFAULT_MONGO_PORT}`;
	process.env.MONGODB_EMULATOR_HOST ??= host;
	return `mongodb://${host}`;
}

export const StormTest_MessagingAcl: StormTestInput = {
	modules: [
		ModuleBE_Firebase,
		ModuleBE_AccountDB,
		ModuleBE_SessionDB,
		...ModulePackBE_Permissions,
		...ModulePackBE_Messaging,
	],
	config: {
		ModuleBE_PermissionsAssert: {strictMode: true},
		ModuleBE_AccountDB: {canRegister: true},
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

export {TEST_MONGO_DB};

export async function impersonateAccount(account: DB_Account): Promise<void> {
	MemKey_AccountId.set(account._id);
	MemKey_SessionData.set({account: account as UI_SessionAccount});
	const permissionsId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
	const userPerm = await ModuleBE_UserPermissionsDB.query.uniqueUnmanipulated(permissionsId);
	if (!userPerm)
		throw new Error(`No UserPermissions for account ${account._id}`);

	MemKey_UserScopePermissions.set(userPerm.scopeEntries ?? []);
	MemKey_UserAccessIds.set(userPerm.accessIds);
}

export async function asAccount<R>(account: DB_Account, action: () => Promise<R>): Promise<R> {
	return new MemStorage().init(async () => {
		await impersonateAccount(account);
		return action();
	});
}

export async function provisionAccounts(...emails: string[]): Promise<DB_Account[]> {
	await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
		await ModuleBE_Permissions.ensureDefinedGroups();
	});

	const accounts: DB_Account[] = [];
	for (const email of emails) {
		const account = await ModuleBE_AccountDB.impl.create({email, type: 'user'});
		await ModuleBE_Permissions.ensureAccountPermissionIdentity(account);
		accounts.push(account);
	}

	await ModuleBE_Permissions.recomputePermissionsForUsers(accounts.map(account => account._id));
	return accounts;
}

export async function createTopicForTest() {
	return ModuleBE_TopicDB.create.item({
		anchor: {
			dbKey: `acl-test-${generateHex(8)}`,
			id: generateHex(32),
		},
	});
}

export async function expectForbidden(action: () => Promise<unknown>): Promise<void> {
	try {
		await action();
		expect.fail('expected ApiException');
	} catch (e) {
		expect(e).to.be.instanceOf(ApiException);
		expect((e as ApiException).responseCode).to.equal(403);
	}
}
