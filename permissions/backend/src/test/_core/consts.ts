import type {DB_PermissionAccessLevel, DB_PermissionDomain, DB_PermissionRole, DB_PermissionProject} from '@nu-art/permissions-shared';
import {
	ModuleBE_PermissionAccessLevelDB,
	ModuleBE_PermissionAPIDB,
	ModuleBE_PermissionDomainDB,
	ModuleBE_PermissionRoleDB,
	ModuleBE_PermissionProjectDB,
	ModuleBE_PermissionUserDB
} from '../../main/index.js';
import {BadImplementationException, PreDB, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {MemKey_AccountId, ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import type {UI_Account} from '@nu-art/user-account-shared';
import {Test_Project, Test_Setup} from './types.js';

export const permissionTestCleanup = async () => {
	await ModuleBE_AccountDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionProjectDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionDomainDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionAPIDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionAccessLevelDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionRoleDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await ModuleBE_PermissionUserDB.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
};

export const setupProjectPermissions = async (projects: Test_Project[]): Promise<{
	domainNameToObjectMap: TypedMap<DB_PermissionDomain>
	accessLevelsByDomainNameMap: TypedMap<TypedMap<DB_PermissionAccessLevel>>
	nameToProjectMap: TypedMap<DB_PermissionProject>
	nameToRoleMap: TypedMap<DB_PermissionRole>
}> => {
	const domainNameToObjectMap: TypedMap<DB_PermissionDomain> = {};
	const accessLevelsByDomainNameMap: TypedMap<TypedMap<DB_PermissionAccessLevel>> = {};
	let nameToRoleMap: TypedMap<DB_PermissionRole> = {};

	// Create All Projects
	const nameToProjectMap: TypedMap<DB_PermissionProject> = reduceToMap(await Promise.all(projects.map(project => ModuleBE_PermissionProjectDB.create.item({
		name: project.name,
		_auditorId: MemKey_AccountId.get()
	}))), project => project.name, project => project);

	await Promise.all(projects.map(async project => {

		const dbProject = nameToProjectMap[project.name];
		await Promise.all(project.domains.map(async domain => {
			if (accessLevelsByDomainNameMap[domain.namespace])
				throw new BadImplementationException(`Same domain ${domain.namespace} was defined twice`);

			// Create Domain
			const dbDomain = await ModuleBE_PermissionDomainDB.create.item({
				namespace: domain.namespace,
				projectId: dbProject._id,
				_auditorId: MemKey_AccountId.get()
			});

			// Create AccessLevels
			const levelsToUpsert = domain.levels.map((level: { name: string; value: number }) => ({
				name: level.name,
				value: level.value,
				domainId: dbDomain._id,
				_auditorId: MemKey_AccountId.get(),
				uiLabel: level.name
			}));
			const dbAccessLevels = await ModuleBE_PermissionAccessLevelDB.create.all(levelsToUpsert);

			// Create AccessLevel ID to DbObject map
			const accessLevelNameToObjectMap = reduceToMap(dbAccessLevels, accessLevel => accessLevel.name, accessLevel => accessLevel);

			// Create Groups
			const dbRoles = await ModuleBE_PermissionRoleDB.create.all(Roles_ToCreate.map(preRole => ({
				label: preRole.label!,
				uiLabel: preRole.label!,
				accessLevelIds: (preRole.accessLevelIds as string[]).map((levelName: string) => accessLevelNameToObjectMap[levelName]._id)
			})) as PreDB<DB_PermissionRole>[]);
			nameToRoleMap = reduceToMap(dbRoles, role => role.label, role => role);

			domainNameToObjectMap[dbDomain.namespace] = dbDomain;
			accessLevelsByDomainNameMap[domain.namespace] = accessLevelNameToObjectMap;
			await Promise.all(project.apis.map(async api => {
				const toCreate = {
					projectId: dbProject._id,
					path: api.path,
					accessLevelIds: api.accessLevels.map(accessLevel => accessLevelsByDomainNameMap[accessLevel.domainName][accessLevel.levelName]._id),
					_auditorId: MemKey_AccountId.get()
				};
				await ModuleBE_PermissionAPIDB.create.item(toCreate);
			}));
		}));
	}));

	return {
		domainNameToObjectMap,
		accessLevelsByDomainNameMap,
		nameToProjectMap,
		nameToRoleMap
	};
};

export const Test_DefaultAccountId = '00000000000000000000000000000000';
export const Test_Account1: UI_Account = {
	email: 'a@a1.a',
	type: 'user'
};
export const Test_Account2: UI_Account = {
	email: 'a@a2.a',
	type: 'user'
};
export const Test_Account3: UI_Account = {
	email: 'a@a3.a',
	type: 'user'
};
export const Test_Account4: UI_Account = {
	email: 'a@a4.a',
	type: 'user'
};
export const Test_Account5: UI_Account = {
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

export const Role_ToCreate_NoAccess: Partial<DB_PermissionRole> = {
	label: 'test-role-no_access',
	accessLevelIds: [Test_AccessLevel_NoAccess]
};
export const Role_ToCreate_Read: Partial<DB_PermissionRole> = {
	label: 'test-role-read',
	accessLevelIds: [Test_AccessLevel_Read]
};
export const Role_ToCreate_Write: Partial<DB_PermissionRole> = {
	label: 'test-role-write',
	accessLevelIds: [Test_AccessLevel_Write]
};
export const Role_ToCreate_Delete: Partial<DB_PermissionRole> = {
	label: 'test-role-delete',
	accessLevelIds: [Test_AccessLevel_Delete]
};
export const Role_ToCreate_Admin: Partial<DB_PermissionRole> = {
	label: 'test-role-admin',
	accessLevelIds: [Test_AccessLevel_Admin]
};
export const Roles_ToCreate = [
	Role_ToCreate_NoAccess,
	Role_ToCreate_Read,
	Role_ToCreate_Write,
	Role_ToCreate_Delete,
	Role_ToCreate_Admin,
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

export const Test_Setup3: Test_Setup = {
	projects: [{
		name: TestProject__Name,
		apis: [
			{
				path: 'v1/stam',
				accessLevels: [{domainName: Test_Domain1, levelName: Test_AccessLevel_Write}],
			}
		],
		domains: [{
			namespace: Test_Domain1,
			levels: Test_AccessLevelsMap
		}],
	}],
};
