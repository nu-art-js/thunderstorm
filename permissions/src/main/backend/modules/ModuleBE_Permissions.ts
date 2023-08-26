import {_keys, Dispatcher, filterInstances, flatArray, Module, MUSTNeverHappenException, PreDB, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {
	ApiDef_Permissions,
	DB_PermissionAccessLevel,
	DB_PermissionApi,
	DB_PermissionDomain,
	DB_PermissionProject,
	Request_ConnectDomainToRoutes
} from '../../shared';
import {ModuleBE_PermissionProject} from './management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from './management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from './management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionGroup} from './assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from './assignment/ModuleBE_PermissionUserDB';
import {CollectSessionData, MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionApi} from './management/ModuleBE_PermissionApi';
import {DefaultDef_Project, SessionData_Permissions} from '../../shared/types';
import {_EmptyQuery} from '@nu-art/firebase';
import {
	Domain_Developer,
	Domain_PermissionsAssign,
	Domain_PermissionsDefine,
	PermissionsPackage_Developer,
	PermissionsPackage_Permissions
} from '../permissions';
import {DefaultAccessLevel_Admin, DefaultAccessLevel_Read, DefaultAccessLevel_Write, defaultLevelsRouteLookupWords} from '../../shared/consts';


export interface CollectPermissionsProjects {
	__collectPermissionsProjects(): DefaultDef_Project;
}

const dispatcher_collectPermissionsProjects = new Dispatcher<CollectPermissionsProjects, '__collectPermissionsProjects'>('__collectPermissionsProjects');
const GroupId_SuperAdmin = '8b54efda69b385a566735cca7be031d5';

const PermissionProject_Permissions: DefaultDef_Project = {
	_id: 'f60db83936835e0be33e89caa365f0c3',
	name: 'Permissions',
	packages: [PermissionsPackage_Permissions, PermissionsPackage_Developer],
	groups: [
		{
			_id: GroupId_SuperAdmin,
			name: 'Super Admin',
			accessLevels: {
				[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Admin.name,
				[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Admin.name,
				[Domain_Developer.namespace]: DefaultAccessLevel_Admin.name,
			}
		},
		{
			_id: '1524909cae174d0052b76a469b339218',
			name: 'Permissions Viewer',
			accessLevels: {
				[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
				[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Write.name,
			}
		},
	]
};

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions>, CollectPermissionsProjects {

	protected init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Permissions.v1.createProject, this.createProject),
			createBodyServerApi(ApiDef_Permissions.v1.connectDomainToRoutes, this.connectDomainToRoutes)
		]);
	}

	__collectPermissionsProjects() {
		return PermissionProject_Permissions;
	}

	async __collectSessionData(accountId: string): Promise<SessionData_Permissions> {
		const user = await ModuleBE_PermissionUserDB.query.uniqueWhere({accountId});
		const permissionMap: TypedMap<number> = {};
		const groupIds = user.groups.map(g => g.groupId);
		const groups = filterInstances(await ModuleBE_PermissionGroup.query.all(groupIds));
		const levelMaps = filterInstances(groups.map(i => i._levelsMap));
		levelMaps.forEach(levelMap => {
			_keys(levelMap).forEach(domainId => {
				if (!permissionMap[domainId])
					permissionMap[domainId] = 0;

				if (levelMap[domainId] > permissionMap[domainId])
					permissionMap[domainId] = levelMap[domainId];
			});
		});

		return {key: 'permissions', value: permissionMap};
	}

	createProject = async () => {
		const projects = dispatcher_collectPermissionsProjects.dispatchModule();

		// Create All Projects
		const _auditorId = MemKey_AccountId.get();
		const preDBProjects = await ModuleBE_PermissionProject.set.all(projects.map(project => ({
			_id: project._id,
			name: project.name,
			_auditorId
		})));
		const projectsMap_nameToDBProject: TypedMap<DB_PermissionProject> = reduceToMap(await Promise.all(preDBProjects), project => project.name, project => project);

		const domainsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => ({
			_id: domain._id,
			namespace: domain.namespace,
			projectId: projectsMap_nameToDBProject[project.name]._id,
			_auditorId
		})))));
		const dbDomain = await ModuleBE_PermissionDomain.set.all(domainsToUpsert);
		const domainsMap_nameToDbDomain = reduceToMap(dbDomain, domain => domain.namespace, domain => domain);

		const levelsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => domain.levels.map(level => {
			return {
				_id: level._id,
				domainId: domainsMap_nameToDbDomain[domain.namespace]._id,
				value: level.value,
				name: level.name,
				_auditorId
			};
		})))));

		const dbLevels = await ModuleBE_PermissionAccessLevel.set.all(levelsToUpsert);
		// @ts-ignore
		const levelsMap_nameToDbAccessLevel = reduceToMap(dbLevels, level => level.name, level => level);
		const domainNameToLevelNameToDBAccessLevel: { [domainName: string]: { [levelName: string]: DB_PermissionAccessLevel } } =
			reduceToMap(dbLevels, level => level.domainId, (level, index, map) => {
				const domainLevels = map[level.domainId] || (map[level.domainId] = {});
				domainLevels[level.name] = level;
				return domainLevels;
			});

		const groupsToUpsert = flatArray(projects.map(project => (project.groups || []).map(group => {
			return {
				_id: group._id,
				_auditorId,
				label: group.name,
				accessLevelIds: _keys(group.accessLevels)
					.map(key => domainNameToLevelNameToDBAccessLevel[domainsMap_nameToDbDomain[key]._id][group.accessLevels[key]]._id)
			};
		})));

		await ModuleBE_PermissionGroup.set.all(groupsToUpsert);
	};

	// _createProject = async () => {
	// 	const existingProject = await ModuleBE_PermissionProject.query.custom({limit: 1});
	// 	if (existingProject.length > 0)
	// 		throw new BadImplementationException(`There are already ${existingProject.length} projects in the system.. there should be only 1`);
	//
	// 	//Create New Project
	// 	const project = await ModuleBE_PermissionProject.create.item({name: 'New Project'} as PreDB<DB_PermissionProject>);
	// 	// Create Project Structure & Super Admin
	// 	const {domains, levels} = await this.createProjectStructure(project);
	//
	// 	const allRoutes = Storm.getInstance().getRoutes();
	//
	// 	//Map out apis
	// 	const apis: Omit<PreDB<DB_PermissionApi>, '_auditorId'>[] = allRoutes.map(route => {
	// 		return {
	// 			projectId: project._id,
	// 			path: route.path,
	// 		};
	// 	}).filter(i => i.path !== '*');
	//
	// 	// Create Project Routes
	// 	await this.createProjectRoutes(project, domains, levels, apis);
	// };

	assignSuperAdmin = async () => {
		const existingSuperAdmin = (await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$ac: GroupId_SuperAdmin}}, limit: 1}))[0];
		if (existingSuperAdmin)
			return;

		const currentUser = (await ModuleBE_PermissionUserDB.query.uniqueWhere({accountId: MemKey_AccountId.get()}));
		if (!currentUser)
			throw new MUSTNeverHappenException('User permissions document must exist at this point');

		(currentUser.groups || (currentUser.groups = [])).push({groupId: GroupId_SuperAdmin});
		await ModuleBE_PermissionUserDB.set.item(currentUser);
	};

	createProjectRoutes = async (project: DB_PermissionProject, domains: DB_PermissionDomain[], levels: DB_PermissionAccessLevel[], apis: Omit<PreDB<DB_PermissionApi>, '_auditorId'>[]) => {
		//Connect default domain access levels to correct apis
		// _keys(defaultDomainDbDefMap).forEach(namespace => {
		// 	const domain = domains.find(i => i.namespace === namespace)!;
		// 	const relevantLevels = levels.filter(i => i.domainId === domain._id);
		// 	const relevantApis = apis.filter(i => defaultDomainDbDefMap[namespace].some(dbDef => i.path.includes(dbDef.dbName)));
		//
		// 	relevantLevels.forEach(level => {
		// 		const lookupWords = defaultLevelsRouteLookupWords[level.name];
		// 		if (!lookupWords)
		// 			return;
		//
		// 		relevantApis.filter(i => lookupWords.some(word => i.path.includes(word)))
		// 			.forEach(api => {
		// 				if (!api.accessLevelIds)
		// 					api.accessLevelIds = [];
		// 				api.accessLevelIds.push(level._id);
		// 			});
		// 	});
		// });
		//
		// await ModuleBE_PermissionApi.create.all(apis as PreDB<DB_PermissionApi>[]);
	};

	private connectDomainToRoutes = async (data: Request_ConnectDomainToRoutes) => {
		const accessLevels = await ModuleBE_PermissionAccessLevel.query.custom({where: {domainId: data.domainId}});
		const apis = (await ModuleBE_PermissionApi.query.custom(_EmptyQuery)).filter(i => i.path.includes(data.dbName));

		accessLevels.forEach(level => {
			const lookupWords = defaultLevelsRouteLookupWords[level.name];
			if (!lookupWords)
				return;

			apis.filter(i => lookupWords.some(word => i.path.includes(word)))
				.forEach(api => {
					if (api.accessLevelIds?.find(i => i === level._id))
						return;

					if (!api.accessLevelIds)
						api.accessLevelIds = [];

					api.accessLevelIds.push(level._id);
				});
		});

		await ModuleBE_PermissionApi.set.all(apis);
	};
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();