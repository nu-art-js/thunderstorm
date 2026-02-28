import {
	_keys,
	arrayToMap,
	Dispatcher,
	filterInstances,
	flatArray,
	Module,
	MUSTNeverHappenException,
	PreDB,
	reduceToMap,
	RuntimeModules,
	TypedMap,
} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {MemKey_ServerApi, ModuleBE_AppConfigDB, ModuleBE_BaseApi_Class, Storm} from '@nu-art/thunderstorm-backend';
import {
	ApiDef_Permissions,
	DatabaseDef_PermissionUser,
	DB_PermissionAccessLevel,
	DB_PermissionAPI,
	DB_PermissionDomain,
	DB_PermissionGroup,
	DB_PermissionProject,
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DefaultDef_AccessLevel,
	DefaultDef_Group,
	defaultLevelsRouteLookupWords,
	DuplicateDefaultAccessLevels,
	SessionData_Permissions,
	toPermissionDomainId,
	toPermissionGroupId,
	toPermissionProjectId,
} from '@nu-art/permissions-shared';
import {BaseSessionClaims, CollectSessionData, MemKey_AccountId, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {getRegisteredFunctionPermissions} from '../core/function-permission-registry.js';
import {md5} from '@nu-art/ts-common';
import {
	Domain_AccountManagement,
	Domain_Developer,
	Domain_PermissionsAssign,
	Domain_PermissionsDefine,
	PermissionsPackage_Developer,
	PermissionsPackage_Permissions
} from '../permissions.js';
import {ModuleBE_PermissionsAssert} from './ModuleBE_PermissionsAssert.js';
import {PerformProjectSetup} from '@nu-art/thunderstorm-backend/modules/action-processor/Action_SetupProject';
import {
	ModuleBE_PermissionAccessLevelDB,
	ModuleBE_PermissionAPIDB,
	ModuleBE_PermissionDomainDB,
	ModuleBE_PermissionGroupDB,
	ModuleBE_PermissionProjectDB,
	ModuleBE_PermissionUserDB
} from '../_entity.js';
import {trimStartingForwardSlash} from '@nu-art/thunderstorm-shared/route-tools';
import {ApiModule} from '@nu-art/thunderstorm-shared';
import {DefaultDef_Project} from '../types.js';


export interface CollectPermissionsProjects {
	__collectPermissionsProjects(): DefaultDef_Project;
}

const dispatcher_collectPermissionsProjects = new Dispatcher<CollectPermissionsProjects, '__collectPermissionsProjects'>('__collectPermissionsProjects');

const GroupId_SuperAdmin = '8b54efda69b385a566735cca7be031d5';

export const PermissionGroup_Permissions_SuperAdmin: DefaultDef_Group = {
	_id: toPermissionGroupId(GroupId_SuperAdmin),
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
	_id: toPermissionGroupId('8c38d3bd2d76bbc37b5281f481c0bc1b'),
	name: 'Permissions Viewer',
	uiLabel: 'Permissions Viewer',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Read.name,
	}
};

export const PermissionGroup_Permissions_Editor: DefaultDef_Group = {
	_id: toPermissionGroupId('1524909cae174d0052b76a469b339218'),
	name: 'Permissions Editor',
	uiLabel: 'Permissions Editor',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Write.name,
	}
};

export const PermissionGroup_Account_Manager: DefaultDef_Group = {
	_id: toPermissionGroupId('6bb5feb12d0712ecee77f7f44188ec79'),
	name: 'Accounts Manager',
	uiLabel: 'Accounts Manager',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Write.name,
	}
};

export const PermissionGroup_Account_Admin: DefaultDef_Group = {
	_id: toPermissionGroupId('761a84bdde3f9be3fde9c50402a60401'),
	name: 'Accounts Admin',
	uiLabel: 'Accounts Admin',
	accessLevels: {
		[Domain_AccountManagement.namespace]: DefaultAccessLevel_Admin.name,
	}
};

export const PermissionGroup_Account_Viewer: DefaultDef_Group = {
	_id: toPermissionGroupId('7343853a980149ec94f967ac7ff4ccc3'),
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
	_id: toPermissionProjectId('f60db83936835e0be33e89caa365f0c3'),
	name: 'Permissions',
	packages: [PermissionsPackage_Permissions, PermissionsPackage_Developer],
	groups: PermissionGroups_Permissions
};

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions>, PerformProjectSetup {

	protected init() {
		super.init();
	}

	@ApiHandler(ApiDef_Permissions.toggleStrictMode)
	async handleToggleStrictMode(_params?: unknown): Promise<void> {
		await this.toggleStrictMode();
	}

	@ApiHandler(ApiDef_Permissions.createProject)
	async handleCreateProject(_params?: unknown): Promise<void> {
		await this.__performProjectSetup().processor();
	}

	// __collectPermissionsProjects() {
	// 	return PermissionProject_Permissions;
	// }

	async __collectSessionData(data: BaseSessionClaims): Promise<SessionData_Permissions> {
		const permissionUserId = data.accountId as unknown as DatabaseDef_PermissionUser['id'];
		const permissionUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(permissionUserId);
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
			priority: 100,
			processor: async () => {
				const projects = dispatcher_collectPermissionsProjects.dispatchModule();
				projects.reduce((issues, project) => {
					return project.packages.reduce((issues, _package) => {
						return issues;
					}, issues);
				}, [] as string[]);

				// Create All Projects
				await this.createPermissionProjects(projects);
				// Create domains/levels from function-permission registry (decorator-collected)
				if (projects.length > 0)
					await this.createDomainsAndLevelsFromFunctionPermissionRegistry(projects[0]._id);
				// Create all AppConfigs
				await this.createPermissionsKeys(projects);
				//Assign Super Admin if necessary
				await this.assignSuperAdmin();
			}
		};
	}

	/**
	 * Creates domains and access levels from the function-permission registry (populated by @RequirePermission decorators).
	 * New (scopeKey, value) pairs get domains/levels created; not assigned to anyone until explicitly assigned.
	 */
	private async createDomainsAndLevelsFromFunctionPermissionRegistry(projectId: import('@nu-art/permissions-shared').DatabaseDef_PermissionProject['id']) {
		const defs = getRegisteredFunctionPermissions();
		if (defs.length === 0)
			return;

		this.logInfoBold('Creating domains/levels from function-permission registry');
		const _auditorId = MemKey_AccountId.get();
		const uniqueScopeKeys = [...new Set(defs.map(d => d.scopeKey))];
		const domainIdByScopeKey: TypedMap<import('@nu-art/permissions-shared').DatabaseDef_PermissionDomain['id']> = {};

		for (const scopeKey of uniqueScopeKeys) {
			const domainId = toPermissionDomainId(md5(`function-permission-domain/${scopeKey}`));
			domainIdByScopeKey[scopeKey] = domainId;
			await ModuleBE_PermissionDomainDB.set.all([{
				_id: domainId,
				namespace: scopeKey,
				projectId,
				_auditorId
			}]);
		}

		const levelValueByName: TypedMap<number> = {
			'No-Access': DefaultAccessLevel_NoAccess.value,
			'Read': DefaultAccessLevel_Read.value,
			'Write': DefaultAccessLevel_Write.value,
			'Delete': DefaultAccessLevel_Delete.value,
			'Admin': DefaultAccessLevel_Admin.value
		};

		for (const def of defs) {
			const domainId = domainIdByScopeKey[def.scopeKey];
			const levelValue = levelValueByName[def.value] ?? 100;
			const levelId = md5(`${domainId}/${def.value}`) as import('@nu-art/permissions-shared').DatabaseDef_PermissionAccessLevel['id'];
			await ModuleBE_PermissionAccessLevelDB.set.all([{
				_id: levelId,
				domainId,
				name: def.value,
				value: levelValue,
				uiLabel: def.value,
				_auditorId
			}]);
			def.domainId = domainId;
			def.levelId = levelId;
			def.levelValue = levelValue;
		}
		this.logInfoBold(`Created ${uniqueScopeKeys.length} domains and ${defs.length} access levels from function-permission registry`);
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
			let levels: DefaultDef_AccessLevel[] = domain.levels ?? DuplicateDefaultAccessLevels(domain._id) as DefaultDef_AccessLevel[];

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
	 * Creates All the DB_PermissionApi (path-based).
	 * @deprecated API collection deprecated; use function-based permissions and @RequirePermission. Domains/levels from function-permission registry instead.
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
		const superAdminGroupId = toPermissionGroupId(GroupId_SuperAdmin);
		const existingSuperAdmin = (await ModuleBE_PermissionUserDB.query.custom({
			where: {__groupIds: {$ac: superAdminGroupId}},
			limit: 1
		}))[0];
		if (existingSuperAdmin)
			return;

		const accountId = MemKey_AccountId.get();
		const currentUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(accountId as unknown as DatabaseDef_PermissionUser['id']);
		(currentUser.groups || (currentUser.groups = [])).push({groupId: superAdminGroupId});
		await ModuleBE_PermissionUserDB.set.item(currentUser);
		await ModuleBE_SessionDB._session.rotate.reissue.bySession();
		this.logInfoBold('Assigned SuperAdmin permissions');
	};
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();