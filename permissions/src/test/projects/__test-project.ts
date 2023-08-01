import {TestSuite} from '@nu-art/ts-common/testing/types';
import '../_core/consts';
import {PreDB} from '@nu-art/ts-common';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {DB_PermissionProject} from '../../main';
import {ModuleBE_PermissionProject} from '../../main/backend/modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionApi} from '../../main/backend/modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionDomain} from '../../main/backend/modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionsAssert} from '../../main/backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export type ProjectInput = {
	project: PreDB<DB_PermissionProject>
}

type CreateAccountTest = TestSuite<ProjectInput, boolean>;

const TestCases_FB_Create: CreateAccountTest['testcases'] = [
	{
		description: 'Create Project',
		input: {project: {name: 'Test Project',}},
		result: true
	},
];

export const TestSuite_Permissions_BasicSetup: CreateAccountTest = {
	label: 'Basic Permissions Setup',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {

		await new MemStorage().init(async () => {
			const dbProject = await ModuleBE_PermissionProject.create.item(testCase.input.project);
			const dbDomain = await ModuleBE_PermissionDomain.create.item({projectId: dbProject._id, namespace: 'test domain'});
			const dbAccessLevels = await ModuleBE_PermissionAccessLevel.create.all([
				{domainId: dbDomain._id, name: 'NoAccess', value: 0},
				{domainId: dbDomain._id, name: 'Read', value: 100},
				{domainId: dbDomain._id, name: 'Write', value: 200},
				{domainId: dbDomain._id, name: 'Delete', value: 300},
				{domainId: dbDomain._id, name: 'Admin', value: 1000},
			]);

			const dbApi = await ModuleBE_PermissionApi.create.item({path: 'v1/stam', projectId: dbProject._id, accessLevelIds: [dbAccessLevels[2]._id]});

			await ModuleBE_PermissionsAssert.assertUserPermissions();
		});

		// TODO: ASSERT PROJECT CREATED
	}
};

describe('Permissions - Basic Setup', () => {
	testSuiteTester(TestSuite_Permissions_BasicSetup);
});