import {_keys, arrayToMap, Dispatcher, filterInstances, flatArray, Module, MUSTNeverHappenException, PreDB, reduceToMap, RuntimeModules, TypedMap,} from '@nu-art/ts-common';
import {addRoutes, createQueryServerApi, MemKey_ServerApi, ModuleBE_AppConfigDB, ModuleBE_BaseApi_Class, Storm} from '@nu-art/thunderstorm/backend';
import {ApiDef_Permissions,} from '../../shared';
import {CollectSessionData, MemKey_AccountId, ModuleBE_SessionDB, SessionCollectionParam} from '@nu-art/user-account/backend';
import {DefaultDef_Group, DefaultDef_Project, SessionData_Permissions} from '../../shared/types';
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
import {PerformProjectSetup} from '@nu-art/thunderstorm/backend/modules/action-processor/Action_SetupProject';
import {
	DB_PermissionAccessLevel,
	DB_PermissionAPI,
	DB_PermissionDomain,
	DB_PermissionGroup,
	DB_PermissionProject,
	ModuleBE_PermissionAccessLevelDB,
	ModuleBE_PermissionAPIDB,
	ModuleBE_PermissionDomainDB,
	ModuleBE_PermissionGroupDB,
	ModuleBE_PermissionProjectDB,
	ModuleBE_PermissionUserDB
} from '../_entity';
import {trimStartingForwardSlash} from '@nu-art/thunderstorm/shared/route-tools';


export interface CollectPermissionsProjects {
	__collectPermissionsProjects(): DefaultDef_Project;
}

const dispatcher_collectPermissionsProjects = new Dispatcher<CollectPermissionsProjects, '__collectPermissionsProjects'>('__collectPermissionsProjects');

const GroupId_SuperAdmin = '8b54efda69b385a566735cca7be031d5';

export const PermissionGroup_Permissions_SuperAdmin: DefaultDef_Group = {
	_id: GroupId_SuperAdmin,
	name: 'Super Admin',
	uiLabel: 'Super Admin',
	accessLevels: {
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Admin.name,
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Admin.name,
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Admin.name,
		[Domain_Developer.namespace]: DefaultAccessLevel_Admin.name,
	}
};

export const PermissionGroup_Permissions_Viewer: DefaultDef_Group = {
	_id: '8c38d3bd2d76bbc37b5281f481c0bc1b',
	name: 'Permissions Viewer',
	uiLabel: 'Permissions Viewer',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Read.name,
	}
};

export const PermissionGroup_Permissions_Editor: DefaultDef_Group = {
	_id: '1524909cae174d0052b76a469b339218',
	name: 'Permissions Editor',
	uiLabel: 'Permissions Editor',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Write.name,
	}
};

export const PermissionGroup_Account_Manager: DefaultDef_Group = {
	_id: '6bb5feb12d0712ecee77f7f44188ec79',
	name: 'Accounts Manager',
	uiLabel: 'Accounts Manager',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Write.name,
	}
};

export const PermissionGroup_Account_Admin: DefaultDef_Group = {
	_id: '761a84bdde3f9be3fde9c50402a60401',
	name: 'Accounts Admin',
	uiLabel: 'Accounts Admin',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Admin.name,
	}
};

export const PermissionGroup_Account_Viewer: DefaultDef_Group = {
	_id: '7343853a980149ec94f967ac7ff4ccc3',
	name: 'Accounts Viewer',
	uiLabel: 'Accounts Viewer',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
	}
};

export const PermissionGroups_Permissions = [
	PermissionGroup_Permissions_SuperAdmin,
	PermissionGroup_Permissions_Viewer,
	PermissionGroup_Permissions_Editor,
	PermissionGroup_Account_Manager,
	PermissionGroup_Account_Admin,
	PermissionGroup_Account_Viewer,
	// {
	// 	_id: '60a417683e4016f4d933fee88953f0d5',
	// 	name: 'Permissions Read Self',
	// 	accessLevels: {
	// 		[Domain_PermissionsDefine.namespace]: PermissionsAccessLevel_ReadSelf.name,
	// 		[Domain_PermissionsAssign.namespace]: PermissionsAccessLevel_ReadSelf.name,
	// 	}
	// },
];

export const PermissionProject_Permissions: DefaultDef_Project = {
	_id: 'f60db83936835e0be33e89caa365f0c3',
	name: 'Permissions',
	packages: [PermissionsPackage_Permissions, PermissionsPackage_Developer],
	groups: PermissionGroups_Permissions
};

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions>, PerformProjectSetup {

	protected init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Permissions.v1.toggleStrictMode, this.toggleStrictMode),
			createQueryServerApi(ApiDef_Permissions.v1.createProject, this.__performProjectSetup().processor),
			// createBodyServerApi(ApiDef_Permissions.v1.connectDomainToRoutes, this.connectDomainToRoutes)
		]);
	}

	// __collectPermissionsProjects() {
	// 	return PermissionProject_Permissions;
	// }

	async __collectSessionData(data: SessionCollectionParam): Promise<SessionData_Permissions> {
		const permissionUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(data.accountId);
		const userGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(permissionUser.groups.map(g => g.groupId)));
		const permissionMap = await this.getUserPermissionMap(userGroups);

		return {
			key: 'permissions', value: {
				domainToValueMap: permissionMap,
				roles: userGroups.map(group => ({key: group.label, uiLabel: group.uiLabel})),
			}
		};
	}

	public getUserPermissionMap = async (userGroups: DB_PermissionGroup[]): Promise<TypedMap<number>> => {
		const permissionMap: TypedMap<number> = {};
		const levelMaps = filterInstances(userGroups.map(i => i._levelsMap));
		levelMaps.forEach(levelMap => {
			_keys(levelMap).forEach(domainId => {
				if (!permissionMap[domainId])
					permissionMap[domainId] = 0;

				if (levelMap[domainId] > permissionMap[domainId])
					permissionMap[domainId] = levelMap[domainId];
			});
		});

		//All domains that are not defined for the user, are NoAccess by default.
		const allDomains = await ModuleBE_PermissionDomainDB.query.where({});
		allDomains.forEach(domain => {
			if (!permissionMap[domain._id])
				permissionMap[domain._id] = DefaultAccessLevel_NoAccess.value; //"fill in the gaps" - All domains that are not defined for the user, are NoAccess by default.
		});
		return permissionMap;
	};

	toggleStrictMode = async () => {
		MemKey_ServerApi.get().addPostCallAction(async () => {
			const envConfigRef = Storm.getInstance().getEnvConfigRef(ModuleBE_PermissionsAssert);
			const currentConfig = await envConfigRef.get({});
			currentConfig.strictMode = !currentConfig.strictMode;
			await envConfigRef.set(currentConfig);
		});
	};

	__performProjectSetup() {
		return {
			priority: 0,
			processor: async () => {
				const projects = dispatcher_collectPermissionsProjects.dispatchModule();
				projects.reduce((issues, project) => {
					return project.packages.reduce((issues, _package) => {
						return issues;
					}, issues);
				}, [] as string[]);

				// Create All Projects
				await this.createPermissionProjects(projects);
				// Create all AppConfigs
				await this.createPermissionsKeys(projects);
				//Assign Super Admin if necessary
				await this.assignSuperAdmin();
			}
		};
	};

	public async createPermissionProjects(projects: DefaultDef_Project[]) {
		const map_nameToDBProject: TypedMap<DB_PermissionProject> = await this.createProjects(projects);
		const map_nameToDbDomain: TypedMap<DB_PermissionDomain> = await this.createDomains(projects, map_nameToDBProject);
		const domainNameToLevelNameToDBAccessLevel: TypedMap<TypedMap<DB_PermissionAccessLevel>> = await this.createAccessLevels(projects, map_nameToDbDomain);
		await this.createGroups(projects, map_nameToDbDomain, domainNameToLevelNameToDBAccessLevel);
		await this.createApis(projects, domainNameToLevelNameToDBAccessLevel);
	}

	/**
	 * Creates All the DB_PermissionProject
	 *
	 * @param projects - predefined permissions projects
	 */
	public async createProjects(projects: DefaultDef_Project[]) {
		this.logInfoBold('Creating Projects');
		const _auditorId = MemKey_AccountId.get();
		const preDBProjects = await ModuleBE_PermissionProjectDB.set.all(projects.map(project => ({
			_id: project._id,
			name: project.name,
			_auditorId
		})));
		const projectsMap_nameToDBProject: TypedMap<DB_PermissionProject> = reduceToMap(preDBProjects, project => project.name, project => project);
		this.logInfoBold(`Created ${preDBProjects.length} Projects`);
		return projectsMap_nameToDBProject;
	}

	/**
	 * Creates All the DB_PermissionDomains
	 *
	 * @param projects - predefined permissions projects
	 * @param map_nameToDBProject
	 */
	private async createDomains(projects: DefaultDef_Project[], map_nameToDBProject: TypedMap<DB_PermissionProject>) {
		this.logInfoBold('Creating Domains');
		const _auditorId = MemKey_AccountId.get();
		const domainsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => ({
			_id: domain._id,
			namespace: domain.namespace,
			projectId: map_nameToDBProject[project.name]._id,
			_auditorId
		})))));
		const dbDomain = await ModuleBE_PermissionDomainDB.set.all(domainsToUpsert);
		const domainsMap_nameToDbDomain = reduceToMap(dbDomain, domain => domain.namespace, domain => domain);
		this.logInfoBold(`Created ${dbDomain.length} Domains`);
		return domainsMap_nameToDbDomain;
	}

	/**
	 * Creates All the DB_PermissionAccessLevel
	 *
	 * @param projects - predefined permissions projects
	 * @param map_nameToDbDomain
	 */
	private async createAccessLevels(projects: DefaultDef_Project[], map_nameToDbDomain: TypedMap<DB_PermissionDomain>) {
		this.logInfoBold('Creating Access Levels');
		const _auditorId = MemKey_AccountId.get();
		const levelsToUpsert = flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => {
			let levels = domain.levels;
			if (!levels)
				levels = DuplicateDefaultAccessLevels(domain._id);

			return levels.map(level => {
				return {
					_id: level._id,
					domainId: map_nameToDbDomain[domain.namespace]._id,
					value: level.value,
					name: level.name,
					uiLabel: level.name,
					_auditorId
				};
			});
		}))));

		const dbLevels = await ModuleBE_PermissionAccessLevelDB.set.all(levelsToUpsert);
		const domainNameToLevelNameToDBAccessLevel: {
			[domainName: string]: { [levelName: string]: DB_PermissionAccessLevel }
		} = reduceToMap(dbLevels, level => level.domainId, (level, index, map) => {
			const domainLevels = map[level.domainId] || (map[level.domainId] = {});
			domainLevels[level.name] = level;
			return domainLevels;
		});
		this.logInfoBold(`Created ${dbLevels.length} Access Levels`);
		return domainNameToLevelNameToDBAccessLevel;
	}

	/**
	 * Creates All the DB_PermissionGroup
	 *
	 * @param projects - predefined permissions projects
	 * @param map_nameToDbDomain
	 * @param domainNameToLevelNameToDBAccessLevel
	 */
	private async createGroups(projects: DefaultDef_Project[], map_nameToDbDomain: TypedMap<DB_PermissionDomain>, domainNameToLevelNameToDBAccessLevel: TypedMap<TypedMap<DB_PermissionAccessLevel>>) {
		this.logInfoBold('Creating Groups');
		const _auditorId = MemKey_AccountId.get();
		const groupsToUpsert = flatArray(projects.map(project => {
			const groupsDef = flatArray([...project.packages.map(p => p.groups || []), ...project.groups || []]);
			return (groupsDef).map(group => {
				return {
					projectId: project._id,
					_id: group._id,
					_auditorId,
					label: group.name,
					uiLabel: group.name,
					accessLevelIds: _keys(group.accessLevels)
						.map(key => {
							const domainsMapNameToDbDomainElement = map_nameToDbDomain[key];
							if (!domainsMapNameToDbDomainElement)
								throw new MUSTNeverHappenException(`bah for key ${key}`);

							return domainNameToLevelNameToDBAccessLevel[domainsMapNameToDbDomainElement._id][group.accessLevels[key]]._id;
						})
				};
			});
		}));
		const dbGroups = await ModuleBE_PermissionGroupDB.set.all(groupsToUpsert);
		this.logInfoBold(`Created ${dbGroups.length} Groups`);
	}

	/**
	 * Creates All the DB_PermissionApi
	 *
	 * @param projects - predefined permissions projects
	 * @param domainNameToLevelNameToDBAccessLevel
	 */
	private async createApis(projects: DefaultDef_Project[], domainNameToLevelNameToDBAccessLevel: TypedMap<TypedMap<DB_PermissionAccessLevel>>) {
		this.logInfoBold('Creating APIs');
		const _auditorId = MemKey_AccountId.get();
		const apisToUpsert = flatArray(projects.map(project => {
			return project.packages.map(_package => _package.domains.map(domain => {
				const apis: PreDB<DB_PermissionAPI>[] = [];

				apis.push(...(domain.customApis || []).map(api => ({
					projectId: project._id,
					path: trimStartingForwardSlash(api.path),
					_auditorId,
					accessLevelIds: [domainNameToLevelNameToDBAccessLevel[api.domainId ?? domain._id][api.accessLevel]._id]
				})));

				const apiModules = arrayToMap(RuntimeModules()
					.filter<ModuleBE_BaseApi_Class<any>>((module: ApiModule) => !!module.apiDef && !!module.dbModule?.dbDef?.dbKey), item => item.dbModule!.dbDef!.dbKey);

				this.logDebug(_keys(apiModules));

				// / I think there is a bug here... comment it and see what happens
				const _apis = (domain.dbNames || []).map(dbName => {
					const apiModule = apiModules[dbName];
					if (!apiModule)
						throw new MUSTNeverHappenException(`Could not find api module with dbName: ${dbName}`);

					const _apiDefs = apiModule.apiDef!;
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

		const dbApis = await ModuleBE_PermissionAPIDB.set.all(apisToUpsert);
		this.logInfoBold(`Created ${dbApis.length} APIs`);
	}

	/**
	 * Creates permission keys associated with the given projects.
	 *
	 * @param projects - An array of projects.
	 */
	private async createPermissionsKeys(projects: DefaultDef_Project[]) {
		this.logInfoBold('Creating App Config');
		// const permissionKeysToCreate: PermissionKey_BE<any>[] = filterInstances(flatArray(projects.map(project => project.packages.map(_package => _package.domains.map(domain => domain.permissionKeys)))));
		try {
			await ModuleBE_AppConfigDB.createDefaults(this);
			this.logInfoBold('Created Permission Key defaults.');
		} catch (e: any) {
			this.logErrorBold('Failed creating Permission Key defaults.', e);
		}
		this.logInfoBold('Created App Config');
	}

	/**
	 * If no "Super Admin" user is defined in the system!
	 * The first user to press the create project button will become the "Super Admin" of the system
	 *
	 * If a "Super Admin" already exists in the system, a 403 will be thrown
	 */
	private assignSuperAdmin = async () => {
		this.logInfoBold('Assigning SuperAdmin permissions');
		const existingSuperAdmin = (await ModuleBE_PermissionUserDB.query.custom({
			where: {__groupIds: {$ac: GroupId_SuperAdmin}},
			limit: 1
		}))[0];
		if (existingSuperAdmin)
			return;

		const currentUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(MemKey_AccountId.get());
		(currentUser.groups || (currentUser.groups = [])).push({groupId: GroupId_SuperAdmin});
		await ModuleBE_PermissionUserDB.set.item(currentUser);
		await ModuleBE_SessionDB.session.rotate();
		this.logInfoBold('Assigned SuperAdmin permissions');
	};
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();