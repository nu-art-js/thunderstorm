import {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionGroup, DB_PermissionProject} from '../../main';
import {ModuleBE_PermissionProject} from '../../main/backend/modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from '../../main/backend/modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionApi} from '../../main/backend/modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionGroup} from '../../main/backend/modules/assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';
import {BadImplementationException, PreDB, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {MemKey_AccountId, ModuleBE_v3_AccountDB} from '@nu-art/user-account/backend';
import {Test_Project, Test_Setup} from './types';
import {UI_Account} from '@nu-art/user-account';

export const postPermissionTestCleanup = async () => {
	await ModuleBE_v3_AccountDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionProject.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionDomain.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionApi.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionAccessLevel.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionGroup.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionUserDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
};

export const setupProjectPermissions = async (projects: Test_Project[]): Promise<{
	domainNameToObjectMap: TypedMap<DB_PermissionDomain>
	accessLevelsByDomainNameMap: TypedMap<TypedMap<DB_PermissionAccessLevel>>
	nameToProjectMap: TypedMap<DB_PermissionProject>
}> => {
	const domainNameToObjectMap: TypedMap<DB_PermissionDomain> = {};
	const accessLevelsByDomainNameMap: TypedMap<TypedMap<DB_PermissionAccessLevel>> = {};

	// Create All Projects
	const nameToProjectMap: TypedMap<DB_PermissionProject> = reduceToMap(await Promise.all(projects.map(project => ModuleBE_PermissionProject.create.item({
		name: project.name,
		_auditorId: MemKey_AccountId.get()
	}))), project => project.name, project => project);

	await Promise.all(projects.map(async project => {

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
	}));

	return {
		domainNameToObjectMap,
		accessLevelsByDomainNameMap,
		nameToProjectMap
	};
};

export const Test_DefaultAccountId = '00000000000000000000000000000000';
export const Test_Account1: PreDB<UI_Account> = {
	email: 'a@a1.a',
	type: 'user'
};
export const Test_Account2: PreDB<UI_Account> = {
	email: 'a@a2.a',
	type: 'user'
};
export const Test_Account3: PreDB<UI_Account> = {
	email: 'a@a3.a',
	type: 'user'
};
export const Test_Account4: PreDB<UI_Account> = {
	email: 'a@a4.a',
	type: 'user'
};
export const Test_Account5: PreDB<UI_Account> = {
	email: 'a@a5.a',
	type: 'user'
};
export const Default_TestEmail = 'test@test.test';
export const Default_TestPassword = '1234';
export const TestProject__Name = 'test-project';
export const Test_Api_Stam = 'v1/stam';

export const Test_AccessLevel_NoAccess = 'NoAccess';
export const Test_AccessLevel_Read = 'Read';
export const Test_AccessLevel_Write = 'Write';
export const Test_AccessLevel_Delete = 'Delete';
export const Test_AccessLevel_Admin = 'Admin';

export const Group_ToCreate_NoAccess: Partial<DB_PermissionGroup> = {
	label: 'test-group-no_access',
	accessLevelIds: [Test_AccessLevel_NoAccess]
};
export const Group_ToCreate_Read: Partial<DB_PermissionGroup> = {
	label: 'test-group-read',
	accessLevelIds: [Test_AccessLevel_Read]
};
export const Group_ToCreate_Write: Partial<DB_PermissionGroup> = {
	label: 'test-group-write',
	accessLevelIds: [Test_AccessLevel_Write]
};
export const Group_ToCreate_Delete: Partial<DB_PermissionGroup> = {
	label: 'test-group-delete',
	accessLevelIds: [Test_AccessLevel_Delete]
};
export const Group_ToCreate_Admin: Partial<DB_PermissionGroup> = {
	label: 'test-group-admin',
	accessLevelIds: [Test_AccessLevel_Admin]
};
export const Groups_ToCreate = [
	Group_ToCreate_NoAccess,
	Group_ToCreate_Read,
	Group_ToCreate_Write,
	Group_ToCreate_Delete,
	Group_ToCreate_Admin,
];


export const Test_Domain1 = 'test-domain-1';

export const Failed_Log = ' ___/-\\___\n' +
	'|---------|\n' +
	' | | F | |\n' +
	' | P a h |\n' +
	' | | i | |\n' +
	' | | l | |\n' +
	' |_______|';

export const Test_AccessLevelsMap = [
	{name: Test_AccessLevel_NoAccess, value: 0},
	{name: Test_AccessLevel_Read, value: 100},
	{name: Test_AccessLevel_Write, value: 200},
	{name: Test_AccessLevel_Delete, value: 300},
	{name: Test_AccessLevel_Admin, value: 1000},
];
export const Test_Setup1: Test_Setup = {
	projects: [{
		name: TestProject__Name,
		apis: [
			{
				path: 'v1/stam',
				accessLevels: [{domainName: Test_Domain1, levelName: Test_AccessLevel_Delete}],
			}
		],
		domains: [{
			namespace: Test_Domain1,
			levels: Test_AccessLevelsMap
		}],
	}],
};

export const Test_Setup2: Test_Setup = {
	projects: [{
		name: TestProject__Name,
		apis: [
			{
				path: 'v1/stam',
				accessLevels: [{domainName: Test_Domain1, levelName: Test_AccessLevel_Read}],
			}
		],
		domains: [{
			namespace: Test_Domain1,
			levels: Test_AccessLevelsMap
		}],
	}],
};
