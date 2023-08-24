import {
	_keys,
	BadImplementationException,
	DBDef,
	dbObjectToId,
	Dispatcher,
	filterInstances,
	flatArray,
	Module,
	PreDB,
	reduceToMap,
	TypedMap
} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi, createQueryServerApi, Storm} from '@nu-art/thunderstorm/backend';
import {
	ApiDef_Permissions,
	DB_PermissionAccessLevel,
	DB_PermissionApi,
	DB_PermissionDomain,
	DB_PermissionGroup,
	DB_PermissionProject,
	DB_PermissionUser,
	DBDef_PermissionAccessLevel,
	DBDef_PermissionApi,
	DBDef_PermissionDomain,
	DBDef_PermissionGroup,
	DBDef_PermissionProjects,
	DBDef_PermissionUser,
	Request_ConnectDomainToRoutes
} from '../../shared';
import {ModuleBE_PermissionProject} from './management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from './management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from './management/ModuleBE_PermissionAccessLevel';
import {defaultAccessLevels, defaultLevelsRouteLookupWords} from '../../shared/management/access-level/consts';
import {defaultDomains, permissionsAssignName, permissionsDefName} from '../../shared/management/domain/consts';
import {ModuleBE_PermissionGroup} from './assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from './assignment/ModuleBE_PermissionUserDB';
import {CollectSessionData, MemKey_AccountId} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionApi} from './management/ModuleBE_PermissionApi';
import {SessionData_Permissions} from '../../shared/types';
import {_EmptyQuery} from '@nu-art/firebase';
import {DefaultDef_Project} from '../types';


const defaultDomainDbDefMap: { [k: string]: DBDef<any, any>[] } = {
	[permissionsDefName]: [DBDef_PermissionProjects, DBDef_PermissionDomain, DBDef_PermissionApi, DBDef_PermissionAccessLevel],
	[permissionsAssignName]: [DBDef_PermissionGroup, DBDef_PermissionUser],
};

export interface CollectPermissionsProjects {
	__collectPermissionsProjects(): DefaultDef_Project;
}

const dispatcher_collectPermissionsProjects = new Dispatcher<CollectPermissionsProjects, '__collectPermissionsProjects'>('__collectPermissionsProjects');

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions> {

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

	protected init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Permissions.v1.createProject, this.createProject),
			createBodyServerApi(ApiDef_Permissions.v1.connectDomainToRoutes, this.connectDomainToRoutes)
		]);
	}

	createProject = async () => {
		const projects = dispatcher_collectPermissionsProjects.dispatchModule();

		// Create All Projects
		const _auditorId = MemKey_AccountId.get();
		const preDBProjects = projects.map(project => ModuleBE_PermissionProject.create.item({
			_id:project._id,
			name: project.name,
			_auditorId
		}));
		const projectsMap_nameToDBProject: TypedMap<DB_PermissionProject> = reduceToMap(await Promise.all(preDBProjects), project => project.name, project => project);

		const domainsToUpsert = flatArray(projects.map(project => project.domains.map(domain => ({
			_id:domain._id,
			namespace: domain.namespace,
			projectId: projectsMap_nameToDBProject[project.name]._id,
			_auditorId
		}))));
		const dbDomain = await ModuleBE_PermissionDomain.set.all(domainsToUpsert);
		const domainsMap_nameToDbDomain = reduceToMap(dbDomain, domain => domain.namespace, domain => domain);

		const levelsToUpsert = flatArray(projects.map(project => project.domains.map(domain => domain.levels.map(level=>{
			return {
				_id:level._id,
				domainId: domainsMap_nameToDbDomain[domain.namespace]._id,
				value: level.value,
				name:level.name,
				_auditorId
			}
		}))))

		const dbLevels = await ModuleBE_PermissionAccessLevel.create.all(levelsToUpsert);
		// @ts-ignore
		const levelsMap_nameToDbAccessLevel = reduceToMap(dbLevels, level => level.name, level => level);
		const domainNameToLevelNameToDBAccessLevel:{[domainName:string]:{[levelName:string]:DB_PermissionAccessLevel}} = {};

		const groupsToUpsert = flatArray(projects.map(project => project.groups.map(group => {
			return {
				_id:group._id,
				_auditorId,
				label: group.name,
				accessLevelIds: _keys(group.accessLevels).map(key=>domainNameToLevelNameToDBAccessLevel[key][group.accessLevels[key]]._id)
			}
		})))

		await ModuleBE_PermissionGroup.create.all(groupsToUpsert);
	};

	_createProject = async () => {
		const existingProject = await ModuleBE_PermissionProject.query.custom({limit: 1});
		if (existingProject.length > 0)
			throw new BadImplementationException(`There are already ${existingProject.length} projects in the system.. there should be only 1`);

		//Create New Project
		const project = await ModuleBE_PermissionProject.create.item({name: 'New Project'} as PreDB<DB_PermissionProject>);
		// Create Project Structure & Super Admin
		const {domains, levels} = await this.createProjectStructure(project);

		const allRoutes = Storm.getInstance().getRoutes();

		//Map out apis
		const apis: Omit<PreDB<DB_PermissionApi>, '_auditorId'>[] = allRoutes.map(route => {
			return {
				projectId: project._id,
				path: route.path,
			};
		}).filter(i => i.path !== '*');

		// Create Project Routes
		await this.createProjectRoutes(project, domains, levels, apis);
	};

	private createProjectStructure = async (project: DB_PermissionProject): Promise<{ domains: DB_PermissionDomain[], levels: DB_PermissionAccessLevel[] }> => {
		//Create initial domains
		const domains = await ModuleBE_PermissionDomain.create.all(defaultDomains.map(i => ({...i, projectId: project._id})));

		//Create initial access levels
		const levels = await ModuleBE_PermissionAccessLevel.create.all(flatArray(domains.map(domain => {
			return defaultAccessLevels.map(level => ({...level, domainId: domain._id}));
		})));

		//Create super-admin permission group
		const group = await ModuleBE_PermissionGroup.create.item({
			label: 'Super Admin',
			accessLevelIds: levels.filter(i => i.name === 'Admin').map(dbObjectToId)
		} as PreDB<DB_PermissionGroup>);

		const triggeringAccountId = MemKey_AccountId.get();

		let user = (await ModuleBE_PermissionUserDB.query.custom({where: {accountId: triggeringAccountId}}))?.[0];
		if (!user) {
			user = await ModuleBE_PermissionUserDB.create.item({
					accountId: triggeringAccountId,
					groups: [{groupId: group._id}]
				} as PreDB<DB_PermissionUser>
			);
		} else {
			if (!user.groups)
				user.groups = [];
			user.groups.push({groupId: group._id});
			await ModuleBE_PermissionUserDB.set.item(user);
		}
		return {domains, levels};
	};

	createProjectRoutes = async (project: DB_PermissionProject, domains: DB_PermissionDomain[], levels: DB_PermissionAccessLevel[], apis: Omit<PreDB<DB_PermissionApi>, '_auditorId'>[]) => {

		//Connect default domain access levels to correct apis
		_keys(defaultDomainDbDefMap).forEach(namespace => {
			const domain = domains.find(i => i.namespace === namespace)!;
			const relevantLevels = levels.filter(i => i.domainId === domain._id);
			const relevantApis = apis.filter(i => defaultDomainDbDefMap[namespace].some(dbDef => i.path.includes(dbDef.dbName)));

			relevantLevels.forEach(level => {
				const lookupWords = defaultLevelsRouteLookupWords[level.name];
				if (!lookupWords)
					return;

				relevantApis.filter(i => lookupWords.some(word => i.path.includes(word)))
					.forEach(api => {
						if (!api.accessLevelIds)
							api.accessLevelIds = [];
						api.accessLevelIds.push(level._id);
					});
			});
		});

		await ModuleBE_PermissionApi.create.all(apis as PreDB<DB_PermissionApi>[]);
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