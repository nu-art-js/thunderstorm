/*
 * @nu-art/permissions-backend - Firebase tests for assign-permissions flow
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';
import {DefaultStormTestConfig_Permissions, type PermissionsTestConfig} from './utils/helpers.js';
import {stormTester} from './utils/storm-tester-stub.js';
import {MemKey_AccountId, ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {
	permissionTestCleanup,
	setupProjectPermissions,
	Test_Api_Stam,
	Test_DefaultAccountId,
	Test_Domain1,
	Test_Setup2
} from './_core/consts.js';
import {MemKey_UserPermissions, ModuleBE_PermissionUserDB, ModuleBE_PermissionsAssert} from '../main/index.js';

type AssignPermissionsSetup = {
	granterEmail: string;
	targetEmail: string;
};
type TestCase_AssignPermissions = TestModel<AssignPermissionsSetup, boolean>;

const test = async (input: AssignPermissionsSetup): Promise<boolean> => {
	await permissionTestCleanup();

	const accounts: { granter: { _id: string }; target: { _id: string } } = {} as { granter: { _id: string }; target: { _id: string } };
	await new MemStorage().init(async () => {
		MemKey_AccountId.set(Test_DefaultAccountId);
		accounts.granter = await ModuleBE_AccountDB.account.create({email: input.granterEmail, type: 'user'}) as { _id: string };
	});
	await new MemStorage().init(async () => {
		MemKey_AccountId.set(accounts.granter._id);
		accounts.target = await ModuleBE_AccountDB.account.create({email: input.targetEmail, type: 'user'}) as { _id: string };
	});

	MemKey_AccountId.set(accounts.granter._id);
	const setupResult = await setupProjectPermissions(Test_Setup2.projects);

	const projectId = setupResult.nameToProjectMap['test-project']._id;
	const domainId = setupResult.domainNameToObjectMap[Test_Domain1]._id;
	const readGroup = setupResult.nameToGroupMap['test-group-read'];
	expect(readGroup).to.exist;

	// Granter has Admin (1000) for the domain
	MemKey_AccountId.set(accounts.granter._id);
	MemKey_UserPermissions.set({[domainId]: 1000});

	await ModuleBE_PermissionUserDB.assignPermissions({
		targetAccountIds: [accounts.target._id],
		permissionGroupIds: [readGroup!._id]
	});

	// Simulate target user's permissions (Read = 100)
	MemKey_UserPermissions.set({[domainId]: 100});

	await ModuleBE_PermissionsAssert.assertPathPermissions(projectId, Test_Api_Stam);
	return true;
};

const runTestCase = (testCase: TestCase_AssignPermissions) => async () =>
	await new MemStorage().init(async () => {
		await runSingleTestCase(test, testCase);
	});

const DefaultStormTest: PermissionsTestConfig = {
	...DefaultStormTestConfig_Permissions
};

describe('Permissions - Assign permissions', () => {
	it('Assign Read group to user then assert path passes', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Assign Read group then assert v1/stam',
			input: {
				granterEmail: 'granter@assign.test',
				targetEmail: 'target@assign.test'
			},
			result: true
		}));
	});
});
