import {TestSuite} from '@thunder-storm/common/testing/types';
import {AssertionException, reduceToMap, UniqueId} from '@thunder-storm/common';
import {MemKey_UserPermissions, ModuleBE_PermissionsAssert} from '../../main/backend';
import {MemStorage} from '@thunder-storm/common/mem-storage/MemStorage';
import {testSuiteTester} from '@thunder-storm/common/testing/consts';
import {
	Failed_Log,
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
	Test_Setup2
} from '../_core/consts';
import {expect} from 'chai';
import {Test_Setup} from '../_core/types';
import {MemKey_AccountId} from '@thunder-storm/user-account/backend';

type CreatePermissionsSetup = {
	setup: Test_Setup,
	users: { accessLevels: { domain: string, levelName: string }[], result: boolean }[];
	check: (projectId: UniqueId, path: string) => Promise<any>;
}
type BasicProjectTest = TestSuite<CreatePermissionsSetup, boolean>;

const TestCases_Basic: BasicProjectTest['testcases'] = [
	{
		description: 'Create Project 1',
		input: {
			setup: Test_Setup1,
			users: [
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_NoAccess}], result: false},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Read}], result: false},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Write}], result: false},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Delete}], result: true},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Admin}], result: true},
			],
			check: async (projectId: UniqueId, path: string) => {
				await ModuleBE_PermissionsAssert.assertUserPermissions(projectId, path);
			}
		},
		result: true
	},
	{
		description: 'Create Project 2',
		input: {
			setup: Test_Setup2,
			users: [
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_NoAccess}], result: false},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Read}], result: true},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Write}], result: true},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Delete}], result: true},
				{accessLevels: [{domain: Test_Domain1, levelName: Test_AccessLevel_Admin}], result: true},
			],
			check: async (projectId: UniqueId, path: string) => {
				await ModuleBE_PermissionsAssert.assertUserPermissions(projectId, path);
			}
		},
		result: true
	},
];

export const TestSuite_Permissions_CreateProject: BasicProjectTest = {
	label: 'Basic Permissions Setup',
	testcases: TestCases_Basic,
	processor: async (testCase) => {
		// todo validate domain names and accesslevels in apis with definition in the setup

		// create all projects
		// create all domains
		// create all access levels
		// create APIs with the associated access levels


		const setup = testCase.input.setup;
		try {
			await new MemStorage().init(async () => {
				MemKey_AccountId.set(Test_DefaultAccountId);

				let finalResult = true;
				await permissionTestCleanup();
				const setupResult = await setupProjectPermissions(setup.projects);

				// Finished to setup the permissions
				// Check all user cases against this setup
				await Promise.all(setup.projects.map(async project => {
					await Promise.all(testCase.input.users.map(async user => {
						let result = true;
						try {
							// {[Domain ID]: [accessLevel's value]}
							const userAccessLevels = reduceToMap(
								user.accessLevels,
								userLevel => setupResult.domainNameToObjectMap[userLevel.domain]._id,
								userLevel => setupResult.accessLevelsByDomainNameMap[userLevel.domain][userLevel.levelName].value
							);

							MemKey_UserPermissions.set(userAccessLevels);

							// The actual test
							await testCase.input.check(setupResult.nameToProjectMap[project.name]._id, Test_Api_Stam);

						} catch (e: any) {
							result = false;
						}
						finalResult &&= (result === user.result);
						expect(result).to.eql(user.result);

					}));
				}));

				if (finalResult !== testCase.result)
					throw new AssertionException('Test did not reach wanted end result.');
			});
		} catch (e: any) {
			console.error('\n' + Failed_Log);
			// console.error('Test failed because:');
			// console.error(e);
			throw e;
		}

	}
};

describe('Permissions - Basic Setup', () => {
	testSuiteTester(TestSuite_Permissions_CreateProject);
});