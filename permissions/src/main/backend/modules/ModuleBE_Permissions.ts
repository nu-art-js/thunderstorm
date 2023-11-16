import {_keys, arrayToMap, Dispatcher, filterInstances, flatArray, Module, MUSTNeverHappenException, PreDB, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi, createQueryServerApi, MemKey_ServerApi, Storm} from '@nu-art/thunderstorm/backend';
import {ApiDef_Permissions, DB_PermissionAccessLevel, DB_PermissionApi, DB_PermissionProject, Request_ConnectDomainToRoutes} from '../../shared';
import {ModuleBE_PermissionProject} from './management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from './management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from './management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionGroup} from './assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionUserDB} from './assignment/ModuleBE_PermissionUserDB';
import {CollectSessionData, MemKey_AccountId, ModuleBE_SessionDB, SessionCollectionParam} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionApi} from './management/ModuleBE_PermissionApi';
import {DefaultDef_Project, SessionData_Permissions} from '../../shared/types';
import {
	Domain_AccountManagement,
	Domain_Developer,
	Domain_PermissionsAssign,
	Domain_PermissionsDefine,
	PermissionsPackage_Developer,
	PermissionsPackage_Permissions
} from '../permissions';
import {
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	defaultLevelsRouteLookupWords,
	DuplicateDefaultAccessLevels
} from '../../shared/consts';
import {ApiModule} from '@nu-art/thunderstorm';
import {ModuleBE_PermissionsAssert} from './ModuleBE_PermissionsAssert';


export interface CollectPermissionsProjects {
	__collectPermissionsProjects(): DefaultDef_Project;
}

const dispatcher_collectPermissionsProjects = new Dispatcher<CollectPermissionsProjects, '__collectPermissionsProjects'>('__collectPermissionsProjects');
const GroupId_SuperAdmin = '8b54efda69b385a566735cca7be031d5';

export const PermissionProject_Permissions: DefaultDef_Project = {
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
				[Domain_AccountManagement.namespace]: DefaultAccessLevel_Admin.name,
				[Domain_Developer.namespace]: DefaultAccessLevel_Admin.name,
			}
		},
		{
			_id: '8c38d3bd2d76bbc37b5281f481c0bc1b',
			name: 'Permissions Viewer',
			accessLevels: {
				[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
				[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
				[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Read.name,
			}
		},
		{
			_id: '1524909cae174d0052b76a469b339218',
			name: 'Permissions Editor',
			accessLevels: {
				[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
				[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
				[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Write.name,
			}
		},
		{
			_id: '6bb5feb12d0712ecee77f7f44188ec79',
			name: 'Accounts Manager',
			accessLevels: {
				[Domain_AccountManagement.namespace]: DefaultAccessLevel_Write.name,
			}
		},
		{
			_id: '761a84bdde3f9be3fde9c50402a60401',
			name: 'Accounts Admin',
			accessLevels: {
				[Domain_AccountManagement.namespace]: DefaultAccessLevel_Admin.name,
			}
		},
		// {
		// 	_id: '60a417683e4016f4d933fee88953f0d5',
		// 	name: 'Permissions Read Self',
		// 	accessLevels: {
		// 		[Domain_PermissionsDefine.namespace]: PermissionsAccessLevel_ReadSelf.name,
		// 		[Domain_PermissionsAssign.namespace]: PermissionsAccessLevel_ReadSelf.name,
		// 	}
		// },
	]
};

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions> {

	protected init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Permissions.v1.toggleStrictMode, this.toggleStrictMode),
			createQueryServerApi(ApiDef_Permissions.v1.createProject, this.createProject),
			createBodyServerApi(ApiDef_Permissions.v1.connectDomainToRoutes, this.connectDomainToRoutes)
		]);
	}

	// __collectPermissionsProjects() {
	// 	return PermissionProject_Permissions;
	// }

	async __collectSessionData(data: SessionCollectionParam): Promise<SessionData_Permissions> {
		const user = await ModuleBE_PermissionUserDB.query.uniqueWhere({_id: data.accountId});
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

		//All domains that are not defined for the user, are NoAccess by default.
		const allDomains = await ModuleBE_PermissionDomain.query.where({});
		allDomains.forEach(domain => {
			if (!permissionMap[domain._id])
				permissionMap[domain._id] = DefaultAccessLevel_NoAccess.value; //"fill in the gaps" - All domains that are not defined for the user, are NoAccess by default.
		});
		return {key: 'permissions', value: permissionMap};
	}

	toggleStrictMode = async () => {
		MemKey_ServerApi.get().addPostCallAction(async () => {
			const envConfigRef = Storm.getInstance().getEnvConfigRef(ModuleBE_PermissionsAssert);
			const currentConfig = await envConfigRef.get({});
			currentConfig.strictMode = !currentConfig.strictMode;
			await envConfigRef.set(currentConfig);
		});
	};

	createProject = async () => {
		const projects = dispatcher_collectPermissionsProjects.dispatchModule();

		// Create All Projects
		const _auditorId = MemKey_AccountId.get();
		const preDBProjects = await ModuleBE_PermissionProject.set.all(projects.map(project => ({
			_id: project._id,
			name: project.name,
			_auditorId
		})));
		const projectsMap_nameToDBProject: TypedMap<DB_PermissionProject> = reduceToMap(preDBProjects, project => project.name, project => project);

		const domainsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => ({
			_id: domain._id,
			namespace: domain.namespace,
			projectId: projectsMap_nameToDBProject[project.name]._id,
			_auditorId
		})))));
		const dbDomain = await ModuleBE_PermissionDomain.set.all(domainsToUpsert);
		const domainsMap_nameToDbDomain = reduceToMap(dbDomain, domain => domain.namespace, domain => domain);

		const levelsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => {
			let levels = domain.levels;
			if (!levels)
				levels = DuplicateDefaultAccessLevels(domain._id);

			return levels.map(level => {
				return {
					_id: level._id,
					domainId: domainsMap_nameToDbDomain[domain.namespace]._id,
					value: level.value,
					name: level.name,
					_auditorId
				};
			});
		}))));

		const dbLevels = await ModuleBE_PermissionAccessLevel.set.all(levelsToUpsert);
		const domainNameToLevelNameToDBAccessLevel: { [domainName: string]: { [levelName: string]: DB_PermissionAccessLevel } } =
			reduceToMap(dbLevels, level => level.domainId, (level, index, map) => {
				const domainLevels = map[level.domainId] || (map[level.domainId] = {});
				domainLevels[level.name] = level;
				return domainLevels;
			});

		const groupsToUpsert = flatArray(projects.map(project => {
			const groupsDef = flatArray([...project.packages.map(p => p.groups || []), ...project.groups || []]);
			return (groupsDef).map(group => {
				return {
					projectId: project._id,
					_id: group._id,
					_auditorId,
					label: group.name,
					accessLevelIds: _keys(group.accessLevels)
						.map(key => domainNameToLevelNameToDBAccessLevel[domainsMap_nameToDbDomain[key]._id][group.accessLevels[key]]._id)
				};
			});
		}));

		//get apis from each project -> project's packages -> packages' domains
		const apisToUpsert = flatArray(projects.map(project => {
			return project.packages.map(_package => _package.domains.map(domain => {
				const apis: PreDB<DB_PermissionApi>[] = [];

				apis.push(...(domain.customApis || []).map(api => ({
					projectId: project._id,
					path: api.path,
					_auditorId,
					accessLevelIds: [domainNameToLevelNameToDBAccessLevel[domain._id][api.accessLevel]._id]
				})));

				const apiModules = arrayToMap(Storm.getInstance()
					.filterModules<ApiModule>((module) => 'dbModule' in module && 'apiDef' in module), item => item.dbModule.dbDef.dbName);

				this.logDebug(_keys(apiModules));

				// / I think there is a bug here... comment it and see what happens
				const _apis = (domain.dbNames || []).map(dbName => {
					const apiModule = apiModules[dbName];
					if (!apiModule)
						throw new MUSTNeverHappenException(`Could not find api module with dbName: ${dbName}`);

					const _apiDefs = apiModule.apiDef;
					return _keys(_apiDefs).map(_apiDefKey => {
						const apiDefs = _apiDefs[_apiDefKey];
						return filterInstances(_keys(apiDefs).map(apiDefKey => {
							const apiDef = apiDefs[apiDefKey];
							const accessLevelNameToAssign = defaultLevelsRouteLookupWords[apiDef.path.substring(apiDef.path.lastIndexOf('/') + 1)];
							const accessLevel = domainNameToLevelNameToDBAccessLevel[domain._id][accessLevelNameToAssign];
							if (!accessLevel)
								return;

							const accessId = accessLevel._id;
							return {
								projectId: project._id,
								path: apiDef.path,
								_auditorId,
								accessLevelIds: [accessId]
							};
						}));
					});
				});
				apis.push(...flatArray(_apis));

				return apis;
			}));
		}));

		await ModuleBE_PermissionApi.set.all(apisToUpsert);
		await ModuleBE_PermissionGroup.set.all(groupsToUpsert);
		await this.assignSuperAdmin();
	};

	assignSuperAdmin = async () => {
		const existingSuperAdmin = (await ModuleBE_PermissionUserDB.query.custom({where: {__groupIds: {$ac: GroupId_SuperAdmin}}, limit: 1}))[0];
		if (existingSuperAdmin)
			return;

		const currentUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(MemKey_AccountId.get());
		(currentUser.groups || (currentUser.groups = [])).push({groupId: GroupId_SuperAdmin});
		await ModuleBE_PermissionUserDB.set.item(currentUser);
		await ModuleBE_SessionDB.session.rotate();
	};

	private connectDomainToRoutes = async (data: Request_ConnectDomainToRoutes) => {
		// const accessLevels = await ModuleBE_PermissionAccessLevel.query.custom({where: {domainId: data.domainId}});
		// const apis = (await ModuleBE_PermissionApi.query.custom(_EmptyQuery)).filter(i => i.path.includes(data.dbName));
		//
		// accessLevels.forEach(level => {
		// 	const lookupWords = defaultLevelsRouteLookupWords[level.name];
		// 	if (!lookupWords)
		// 		return;
		//
		// 	apis.filter(i => lookupWords.some(word => i.path.includes(word)))
		// 		.forEach(api => {
		// 			if (api.accessLevelIds?.find(i => i === level._id))
		// 				return;
		//
		// 			if (!api.accessLevelIds)
		// 				api.accessLevelIds = [];
		//
		// 			api.accessLevelIds.push(level._id);
		// 		});
		// });
		//
		// await ModuleBE_PermissionApi.set.all(apis);
	};
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();