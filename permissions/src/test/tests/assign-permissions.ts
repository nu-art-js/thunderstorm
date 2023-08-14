import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {AssertionException, reduceToMap, UniqueId} from '@nu-art/ts-common';
import {Test_Setup} from './create-project';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {
	Failed_Log,
	postPermissionTestCleanup,
	setupProjectPermissions,
	Test_AccountId1,
	Test_AccountId2,
	Test_AccountId3,
	Test_AccountId4,
	Test_AccountId5,
	Test_DefaultAccountId,
	Test_Domain1,
	Test_Setup1
} from '../_core/consts';
import {MemKey_UserPermissions} from '../../main/backend';
import {expect} from 'chai';
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';

type AssignPermissionsSetup = {
	setup: Test_Setup
	check: (projectId: UniqueId, accountToGivePermissionIds: string[], groupIds: string[], groupsToRemoveIds: string[]) => Promise<any>
	targetAccounts: {
		_id: string,
		domains: {
			namespace: string,
			accessLevel: string
		}[],
		result: boolean
	}[]
	selfAccount: {
		_id: string,
		domains: {
			namespace: string,
			accessLevel: string
		}[]
	}
}

type BasicProjectTest = TestSuite<AssignPermissionsSetup, boolean>;

const Test_AllAccounts = [{
	_id: Test_AccountId1,
	domains: [{
		namespace: Test_Domain1,
		accessLevel: 'NoAccess'
	}],
	result: false
},
	{
		_id: Test_AccountId2,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Read'
		}],
		result: false
	},
	{
		_id: Test_AccountId3,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Write'
		}],
		result: false
	},
	{
		_id: Test_AccountId4,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Delete'
		}],
		result: false
	},
	{
		_id: Test_AccountId5,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Admin'
		}],
		result: false
	}];

const TestCases_Basic: BasicProjectTest['testcases'] = [{
	description: 'Assign Permissions',
	input: {
		setup: Test_Setup1,
		check: async (projectId: UniqueId, targetAccountIds: string[], groupToAddIds: string[], groupToRemoveIds: string[]) => {
			await ModuleBE_PermissionUserDB.assignPermissions({
				projectId: projectId,
				targetAccountIds: targetAccountIds,
				groupToAddIds: groupToAddIds,
				groupToRemoveIds: groupToRemoveIds
			});
		},
		targetAccounts: Test_AllAccounts,
		selfAccount: {
			_id: Test_DefaultAccountId,
			domains: [{
				namespace: Test_Domain1,
				accessLevel: 'Read'
			}]
		}
	},
	result: true
}];


export const TestSuite_Permissions_AssignPermissions: BasicProjectTest = {
	label: 'Basic Permissions Setup',
	testcases: TestCases_Basic,
	processor: async (testCase) => {
		//setup
		//include target users to give permissions to
		//include self user - that has permission level which is enough/too-low to give permissions to target user


		const setup = testCase.input.setup;
		try {
			await new MemStorage().init(async () => {
				MemKey_AccountId.set(Test_DefaultAccountId);

				let finalResult = true;
				const setupResult = await setupProjectPermissions(setup.projects);

				// Finished to setup the permissions
				// Check all user cases against this setup
				await Promise.all(setup.projects.map(async project => {

					testCase.input.selfAccount.domains.map(domain => {

					});

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
							await testCase.input.check(setupResult.nameToProjectMap[project.name]._id, [], [], []);

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

		// Post Test Cleanup
		await postPermissionTestCleanup();
	}
};
describe('Permissions - Assign Permissions', () => {
	testSuiteTester(TestSuite_Permissions_AssignPermissions);
});