import {TestSuite} from '@nu-art/ts-common/testing/types';
import {PreDB, UniqueId} from '@nu-art/ts-common';
import {DB_PermissionAccessLevel, DB_PermissionApi, DB_PermissionDomain, DB_PermissionProject} from '../../main';
import {ModuleBE_PermissionProject} from '../../main/backend/modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionApi} from '../../main/backend/modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionDomain} from '../../main/backend/modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionsAssert} from '../../main/backend';
import {MemKey, MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestProject__Name} from '../_core/consts';
import {MemKey_AccountEmail} from '@nu-art/user-account/backend';

type InputPermissionsSetup = {
	setup: {
		project: PreDB<DB_PermissionProject>;
		domain: Omit<PreDB<DB_PermissionDomain>, 'projectId'>;
		accessLevels: Omit<PreDB<DB_PermissionAccessLevel>, 'domainId'>[];
		apis: (Omit<PreDB<DB_PermissionApi>, 'accessLevelIds' | 'projectId'> & { accessLevelNames: string[] })[];
	},
	userAccessLevelNames: string[];
	check: (projectId: UniqueId) => Promise<any>;
}

type BasicProjectTest = TestSuite<InputPermissionsSetup, boolean>;

const TestCases_Basic: BasicProjectTest['testcases'] = [
	{
		description: 'Create Project',
		input: {
			setup: {
				project: {name: TestProject__Name},
				domain: {namespace: 'test domain'},
				accessLevels: [
					{name: 'NoAccess', value: 0},
					{name: 'Read', value: 100},
					{name: 'Write', value: 200},
					{name: 'Delete', value: 300},
					{name: 'Admin', value: 1000},
				],
				apis: [
					{path: 'v1/stam', accessLevelNames: ['Read', 'Delete']}
				]
			},
			userAccessLevelNames: ['Write'],
			check: async (projectId: UniqueId) => {
				await ModuleBE_PermissionsAssert.assertUserPermissions(projectId, 'v1/stam', {});
			}
		},
		result: true
	},
];

export const TestSuite_Permissions_BasicSetup: BasicProjectTest = {
	label: 'Basic Permissions Setup',
	testcases: TestCases_Basic,
	processor: async (testCase) => {
		const setup = testCase.input.setup;
		const MemKey_UserPermissions = new MemKey<DB_PermissionAccessLevel[]>('user-permissions');

		await new MemStorage().init(async () => {
			MemKey_AccountEmail.set('test');

			const dbProject = await ModuleBE_PermissionProject.create.item(setup.project);
			const dbDomain = await ModuleBE_PermissionDomain.create.item({...setup.domain, projectId: dbProject._id});
			const dbAccessLevels = await ModuleBE_PermissionAccessLevel.create.all(setup.accessLevels.map(_level => ({
				..._level,
				domainId: dbDomain._id
			})));
			const dbApi = await ModuleBE_PermissionApi.create.all(setup.apis.map(_api => {
				return {
					projectId: dbProject._id,
					path: _api.path,
					accessLevelIds: _api.accessLevelNames.map(_name => dbAccessLevels.find(_level => _level.name === _name)._id)
				};
			}));

			MemKey_UserPermissions.set(testCase.input.userAccessLevelNames.map(_name => dbAccessLevels.find(_level => _level.name === _name)));
			await testCase.input.check(dbProject._id);
		});
	}
};

describe('Permissions - Basic Setup', () => {
	testSuiteTester(TestSuite_Permissions_BasicSetup);
});