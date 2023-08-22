import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {BadImplementationException, dbObjectToId, filterInstances, reduceToMap, UniqueId} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_AccountId, ModuleBE_AccountDB} from '@nu-art/user-account/backend';
import {
	Failed_Log,
	permissionTestCleanup,
	setupProjectPermissions,
	Test_AccessLevel_Admin,
	Test_AccessLevel_Delete,
	Test_AccessLevel_NoAccess,
	Test_AccessLevel_Read,
	Test_AccessLevel_Write,
	Test_AccessLevelsMap,
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
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';
import {Test_Setup, Test_TargetAccount} from '../_core/types';
import {expect} from 'chai';

import {ModuleBE_PermissionGroup} from '../../main/backend/modules/assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';

type AssignPermissionsSetup = {
	setup: Test_Setup
	check: (projectId: UniqueId, accountToGivePermissionIds: string[], permissionGroupIds: string[]) => Promise<any>
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
const Test_AllAccounts: Test_TargetAccount[] = [
	{
		...Test_Account1,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: Test_AccessLevel_NoAccess
		}],
		result: true
	},
	{
		...Test_Account2,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: Test_AccessLevel_Read
		}],
		result: true
	},
	{
		...Test_Account3,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: Test_AccessLevel_Write
		}],
		result: false
	},
	{
		...Test_Account4,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: Test_AccessLevel_Delete
		}],
		result: false
	},
	{
		...Test_Account5,
		domains: [{
			namespace: Test_Domain1,
			accessLevel: Test_AccessLevel_Admin
		}],
		result: false
	}
];

const TestCases_Basic: BasicProjectTest['testcases'] = [{
	description: 'Assign Permissions',
	input: {
		setup: Test_Setup1,
		check: async (projectId: UniqueId, targetAccountIds: string[], permissionGroupIds: string[]) => {
			await ModuleBE_PermissionUserDB.assignPermissions({
				projectId: projectId,
				targetAccountIds: targetAccountIds,
				permissionGroupIds: permissionGroupIds,
			});
		},
		targetAccounts: Test_AllAccounts,
		selfAccount: {
			...DefaultSelfAccount,
			domains: [{
				namespace: Test_Domain1,
				accessLevel: Test_AccessLevel_NoAccess
			}]
		}
	},
	result: true
}];


export const TestSuite_Permissions_AssignPermissions: BasicProjectTest = {
	label: 'Basic Permissions Setup',
	testcases: TestCases_Basic,
	processor: async (testCase) => {
		const setup = testCase.input.setup;
		try {
			await new MemStorage().init(async () => {
				MemKey_AccountId.set(Test_DefaultAccountId);

				let finalResult = true;
				await permissionTestCleanup();

				const setupResult = await setupProjectPermissions(setup.projects);
				const allGroups = await ModuleBE_PermissionGroup.query.custom(_EmptyQuery);
				const allAccessLevels = reduceToMap(await ModuleBE_PermissionAccessLevel.query.custom(_EmptyQuery), dbObjectToId, item => item);
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
						// Create account
						const createdTargetAccount = await ModuleBE_AccountDB.create.item({
							_id: targetAccount._id,
							type: targetAccount.type,
							email: targetAccount.email,
							_auditorId: MemKey_AccountId.get()
						});
						// Create related PermissionUser object
						await ModuleBE_PermissionUserDB.insertIfNotExist(createdTargetAccount.email);
						const createdTargetPermissionUser = await ModuleBE_PermissionUserDB.query.uniqueWhere({accountId: createdTargetAccount._id});

						// Get groups to assign to target account
						const groupsToAssign = filterInstances(targetAccount.domains.map(dom => {
							return allGroups.find(grp => {
								if (grp.accessLevelIds.length !== 1) // Using direct groups - groups that contain only the 1 meaningful access level
									return false;

								const wantedLevelValue = Test_AccessLevelsMap.find(row => row.name === dom.accessLevel);
								if (!wantedLevelValue)
									throw new BadImplementationException(`Using non-existent accessLevel in test: ${dom.accessLevel}`);

								const _accessLevel = allAccessLevels[grp.accessLevelIds[0]];

								// console.log('-----------wantedLevelValue----------');
								// console.log(wantedLevelValue);
								// console.log('-----------good accessLevel----------');
								// console.log(_accessLevel);
								// console.log('---------------------');
								// console.log(`${_accessLevel.value} === ${wantedLevelValue.value} ${_accessLevel.value === wantedLevelValue.value}`);
								return _accessLevel.value === wantedLevelValue.value;
							});
						}));

						if (groupsToAssign.length !== targetAccount.domains.length)
							throw new BadImplementationException(`Couldn't find all test permission groups!`);

						//todo create groups matching the required domains for this targetAccount
						let result = true;
						try {
							// console.log();
							await testCase.input.check(
								setupResult.nameToProjectMap[project.name]._id,
								[createdTargetPermissionUser._id],
								groupsToAssign.map(g => g._id),
							);
						} catch (e: any) {
							result = false;
							console.log(e);
						}
						finalResult &&= (result === testCase.result);
						expect(result).to.eql(testCase.result);
					}));
				}));


				// if (finalResult !== testCase.result)
				// 	throw new AssertionException('Test did not reach wanted end result.');
				expect(finalResult).to.eql(testCase.result);

			});
		} catch (e: any) {
			console.error('\n' + Failed_Log);
			// console.error('Test failed because:');
			// console.error(e);
			throw e;
		}

		// Post Test Cleanup
		await permissionTestCleanup();
	}
};
// describe('Permissions - Assign Permissions', () => {
// 	testSuiteTester(TestSuite_Permissions_AssignPermissions);
// });