/*
 * @nu-art/permissions-backend - Firebase tests for create project and path-based assert
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AssertionException, reduceToMap, UniqueId} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';
import {DefaultStormTestConfig_Permissions, type PermissionsTestConfig} from './utils/helpers.js';
import {stormTester} from './utils/storm-tester-stub.js';
import {MemKey_UserPermissions, ModuleBE_PermissionsAssert} from '../main/index.js';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {
	permissionTestCleanup,
	setupProjectPermissions,
	Test_AccessLevel_Admin,
	Test_AccessLevel_Delete,
	Test_AccessLevel_NoAccess,
	Test_AccessLevel_Read,
	Test_AccessLevel_Write,
	Test_Api_Stam,
	Test_DefaultAccountId,
	Test_Domain1,
	Test_Setup1,
	Test_Setup2,
	Test_Setup3
} from './_core/consts.js';
import type {Test_Setup} from './_core/types.js';
type CreatePermissionsSetup = {
	setup: Test_Setup;
	users: { accessLevels: { domain: string; levelName: string }[]; result: boolean }[];
	check: (projectId: UniqueId, path: string) => Promise<void>;
};
type TestCase_CreateProject = TestModel<CreatePermissionsSetup, boolean>;

const test = async (input: CreatePermissionsSetup): Promise<boolean> => {
	await permissionTestCleanup();
	const setupResult = await setupProjectPermissions(input.setup.projects);
	let finalResult = true;
	await Promise.all(input.setup.projects.map(async project => {
		await Promise.all(input.users.map(async user => {
			const userAccessLevels = reduceToMap(
				user.accessLevels,
				userLevel => setupResult.domainNameToObjectMap[userLevel.domain]._id,
				userLevel => setupResult.accessLevelsByDomainNameMap[userLevel.domain][userLevel.levelName].value
			);
			MemKey_UserPermissions.set(userAccessLevels);
			let result = true;
			try {
				await input.check(setupResult.nameToProjectMap[project.name]._id, Test_Api_Stam);
			} catch {
				result = false;
			}
			finalResult &&= (result === user.result);
			expect(result).to.eql(user.result);
		}));
	}));
	if (!finalResult)
		throw new AssertionException('Test did not reach wanted end result.');
	return true;
};

const runTestCase = (testCase: TestCase_CreateProject) => async () =>
	await new MemStorage().init(async () => {
		MemKey_AccountId.set(Test_DefaultAccountId);
		await runSingleTestCase(test, testCase);
	});

const DefaultStormTest: PermissionsTestConfig = {
	...DefaultStormTestConfig_Permissions
};

describe('Permissions - Create Project (path-based assert)', () => {
	it('Create Project 1 - API requires Delete level', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Create Project 1',
			input: {
				setup: Test_Setup1,
				users: [
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_NoAccess }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Read }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Write }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Delete }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Admin }], result: true }
				],
				check: async (projectId: UniqueId, path: string) => {
					await ModuleBE_PermissionsAssert.assertPathPermissions(projectId, path);
				}
			},
			result: true
		}));
	});

	it('Create Project 2 - API requires Read level', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Create Project 2',
			input: {
				setup: Test_Setup2,
				users: [
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_NoAccess }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Read }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Write }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Delete }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Admin }], result: true }
				],
				check: async (projectId: UniqueId, path: string) => {
					await ModuleBE_PermissionsAssert.assertPathPermissions(projectId, path);
				}
			},
			result: true
		}));
	});

	it('Create Project 3 - API requires Write level', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Create Project 3',
			input: {
				setup: Test_Setup3,
				users: [
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_NoAccess }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Read }], result: false },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Write }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Delete }], result: true },
					{ accessLevels: [{ domain: Test_Domain1, levelName: Test_AccessLevel_Admin }], result: true }
				],
				check: async (projectId: UniqueId, path: string) => {
					await ModuleBE_PermissionsAssert.assertPathPermissions(projectId, path);
				}
			},
			result: true
		}));
	});
});
