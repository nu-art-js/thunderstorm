import {TestSuite} from '@nu-art/ts-common/testing/types';
import {
	AssertionException,
	BadImplementationException,
	PreDB,
	reduceToMap,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionGroup} from '../../main';
import {ModuleBE_PermissionProject} from '../../main/backend/modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionApi} from '../../main/backend/modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionDomain} from '../../main/backend/modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';
import {MemKey_UserPermissions, ModuleBE_PermissionsAssert} from '../../main/backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {
	Failed_Log,
	Groups_ToCreate,
	Test_AccessLevel_Admin,
	Test_AccessLevel_Delete,
	Test_AccessLevel_NoAccess,
	Test_AccessLevel_Read,
	Test_AccessLevel_Write,
	Test_Api_Stam,
	Test_Domain1,
	Test_Setup1, Test_Setup2
} from '../_core/consts';
import {ModuleBE_PermissionGroup} from '../../main/backend/modules/assignment/ModuleBE_PermissionGroup';
import {MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';
import {expect} from 'chai';


type Test_Api = { path: string, accessLevels: { domainName: string, levelName: string }[] };
export type Test_Setup = {
	projects: {
		name: string,
		apis: Test_Api[],
		domains: {
			namespace: string,
			levels: { name: string, value: number }[]
		}[]
	}[];
};
type InputPermissionsSetup = {
	setup: Test_Setup,
	users: { accessLevels: { domain: string, levelName: string }[], result: boolean }[];
	check: (projectId: UniqueId, path: string) => Promise<any>;
}
type BasicProjectTest = TestSuite<InputPermissionsSetup, boolean>;

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

export const TestSuite_Permissions_BasicSetup: BasicProjectTest = {

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
				MemKey_AccountId.set('00000000000000000000000000000000');

				const domainNameToObjectMap: TypedMap<DB_PermissionDomain> = {};
				const accessLevelsByDomainNameMap: TypedMap<TypedMap<DB_PermissionAccessLevel>> = {};

				// Create All Projects
				const nameToProjectMap = reduceToMap(await Promise.all(setup.projects.map(project => ModuleBE_PermissionProject.create.item({
					name: project.name,
					_auditorId: MemKey_AccountId.get()
				}))), project => project.name, project => project);
				let finalResult = true;
				await Promise.all(setup.projects.map(async project => {

					const dbProject = nameToProjectMap[project.name];
					await Promise.all(project.domains.map(async domain => {
						if (accessLevelsByDomainNameMap[domain.namespace])
							throw new BadImplementationException(`Same domain ${domain.namespace} was defined twice`);

						// Create Domain
						const dbDomain = await ModuleBE_PermissionDomain.create.item({
							namespace: domain.namespace,
							projectId: dbProject._id,
							_auditorId: MemKey_AccountId.get()
						});

						// Create AccessLevels
						const levelsToUpsert = domain.levels.map(levelName => ({
							...levelName,
							domainId: dbDomain._id,
							_auditorId: MemKey_AccountId.get()
						}));
						const dbAccessLevels = await ModuleBE_PermissionAccessLevel.create.all(levelsToUpsert);

						// Create AccessLevel ID to DbObject map
						const accessLevelNameToObjectMap = reduceToMap(dbAccessLevels, accessLevel => accessLevel.name, accessLevel => accessLevel);

						// Create Groups
						await ModuleBE_PermissionGroup.create.all(Groups_ToCreate.map(preGroup => ({
							label: preGroup.label,
							accessLevelIds: preGroup.accessLevelIds!.map(levelName => accessLevelNameToObjectMap[levelName]._id)
						})) as PreDB<DB_PermissionGroup>[]);


						domainNameToObjectMap[dbDomain.namespace] = dbDomain;
						accessLevelsByDomainNameMap[domain.namespace] = accessLevelNameToObjectMap;
						await Promise.all(project.apis.map(async api => {
							const toCreate = {
								projectId: dbProject._id,
								path: api.path,
								accessLevelIds: api.accessLevels.map(accessLevel => accessLevelsByDomainNameMap[accessLevel.domainName][accessLevel.levelName]._id),
								_auditorId: MemKey_AccountId.get()
							};
							await ModuleBE_PermissionApi.create.item(toCreate);
						}));
					}));
					// Finished to setup the permissions
					// Check all user cases against this setup
					await Promise.all(testCase.input.users.map(async user => {
						let result = true;
						try {
							// {[Domain ID]: [accessLevel's value]}
							const userAccessLevels = reduceToMap(
								user.accessLevels,
								userLevel => domainNameToObjectMap[userLevel.domain]._id,
								userLevel => accessLevelsByDomainNameMap[userLevel.domain][userLevel.levelName].value
							);


							MemKey_UserPermissions.set(userAccessLevels);

							// The actual test
							await testCase.input.check(nameToProjectMap[project.name]._id, Test_Api_Stam);

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
		await ModuleBE_PermissionProject.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PermissionDomain.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PermissionApi.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PermissionAccessLevel.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PermissionGroup.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PermissionUserDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	}
};

describe('Permissions - Basic Setup', () => {
	testSuiteTester(TestSuite_Permissions_BasicSetup);
});