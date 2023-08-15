import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {AssertionException, reduceToMap, UniqueId} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_AccountId, ModuleBE_v2_AccountDB} from '@nu-art/user-account/backend';
import {
	Failed_Log,
	postPermissionTestCleanup,
	setupProjectPermissions,
	Test_Account1,
	Test_Account2,
	Test_Account3,
	Test_Account4,
	Test_Account5,
	Test_DefaultAccountId,
	Test_Domain1,
	Test_Setup1
} from '../_core/consts';
import {MemKey_UserPermissions} from '../../main/backend';
import {expect} from 'chai';
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';
import {Test_Setup, Test_TargetAccount} from '../_core/types';

type AssignPermissionsSetup = {
	setup: Test_Setup
	check: (projectId: UniqueId, accountToGivePermissionIds: string[], groupIds: string[], groupsToRemoveIds: string[]) => Promise<any>
	targetAccounts: Test_TargetAccount[]
	selfAccount: {
		_id: string,
		domains: {
			namespace: string,
			accessLevel: string
		}[]
	}
}

type BasicProjectTest = TestSuite<AssignPermissionsSetup, boolean>;

const DefaultSelfAccount = {
	_id: Test_DefaultAccountId,
};
const Test_AllAccounts: Test_TargetAccount[] = [{
	...Test_Account1,
	domains: [{
		namespace: Test_Domain1,
		accessLevel: 'NoAccess'
	}],
	result: false
},
	{
		...Test_Account2,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Read'
		}],
		result: false
	},
	{
		...Test_Account3,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Write'
		}],
		result: false
	},
	{
		...Test_Account4,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: 'Delete'
		}],
		result: false
	},
	{
		...Test_Account5,
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
			...DefaultSelfAccount,
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
					// Setup user permissions
					const userAccessLevels = reduceToMap(
						testCase.input.selfAccount.domains,
						domain => setupResult.domainNameToObjectMap[domain.namespace]._id,
						domain => setupResult.accessLevelsByDomainNameMap[domain.namespace][domain.accessLevel].value
					);
					MemKey_UserPermissions.set(userAccessLevels);

					await Promise.all(testCase.input.targetAccounts.map(async targetAccount => {
						const createdTargetAccount = await ModuleBE_v2_AccountDB.create.item({
							_id: targetAccount._id,
							type: targetAccount.type,
							email: targetAccount.email,
							_auditorId: MemKey_AccountId.get()

						});


						//todo create groups matching the required domains for this targetAccount

						await ModuleBE_PermissionUserDB.assignPermissions({
							projectId: setupResult.nameToProjectMap[project.name]._id,
							targetAccountIds: [createdTargetAccount._id],
							groupToAddIds: [],
							groupToRemoveIds: [],
						});
					}));


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