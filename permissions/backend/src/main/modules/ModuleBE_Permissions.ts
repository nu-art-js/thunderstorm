import {_keys, ApiException, batchActionParallel, Dispatcher, filterDuplicates, filterInstances, flatArray, md5, Module, UniqueId} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_PermissionRole, DatabaseDef_PermissionUser, DatabaseDef_UserPermissions, DB_PermissionRole, DB_PermissionScope, DB_UserPermissions, PermissionScope} from '@nu-art/permissions-shared';
import {getRegisteredRoleDefinitions, permissionScopeId,} from '@nu-art/permissions-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {getRegisteredFunctionPermissions, getScopeValues} from '../core/function-permission-registry.js';
import {ModuleBE_PermissionRoleDB} from '../_entity/permission-role/ModuleBE_PermissionRoleDB.js';
import {ModuleBE_PermissionScopeDB} from '../_entity/permission-scope/ModuleBE_PermissionScopeDB.js';
import {ModuleBE_PermissionUserDB} from '../_entity/permission-user/ModuleBE_PermissionUserDB.js';
import {ModuleBE_UserPermissionsDB} from '../_entity/user-permissions/ModuleBE_UserPermissionsDB.js';
import {FirebaseRef, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {MemKey_ServiceAccountId, MemKey_UserScopePermissions} from '../consts.js';


// --- Types consumed by app modules via CollectDefaultScopeValues dispatcher ---

export type DefaultScopeGrant = {
	readonly scope: PermissionScope;
	readonly value: string;
};

export interface CollectDefaultScopeValues {
	__collectDefaultScopeValues(): DefaultScopeGrant[];
}

// --- Service account config (module config, managed via config pipeline) ---
//
// FUTURE: Service account definitions are currently delivered via the module config pipeline,
// which means app-level code can override them. This should be hardened so that SA configs
// are read from a tamper-resistant source (e.g. a private RTDB path with no exposed write API,
// or hardcoded frozen constants for well-known SAs). The bootstrap SA is safe today because
// MemKey encapsulation prevents direct permission escalation, but additional SAs for
// refactoring actions or other elevated operations should be protected against app-level injection.

export type ServiceAccountConfig = {
	readonly scopes: string[];
	readonly enabled: boolean;
	readonly systemOnly: boolean;
};

export const ServiceAccountId_Bootstrap = 'bootstrap-admin';

type Config = {
	serviceAccounts: Record<string, ServiceAccountConfig>;
};

// --- Well-known role IDs ---

export const RoleId_AppDefault = stringToUniqueId<DatabaseDef_PermissionRole['dbKey']>(md5('app/default'));
export const RoleId_PermissionsAdmin = stringToUniqueId<DatabaseDef_PermissionRole['dbKey']>(md5('permissions/admin'));

// --- Module ---

const dispatcher_collectDefaultScopeValues = new Dispatcher<CollectDefaultScopeValues, '__collectDefaultScopeValues'>('__collectDefaultScopeValues');

export const SetupTaskKey_PermissionsRoles = asSetupTaskKey('permissions-roles');

export const PermissionRole_SuperAdmin_ScopeIds = [permissionScopeId('permissions', 'admin')];

class ModuleBE_Permissions_Class
	extends Module<Config>
	implements PerformProjectSetup {

	private adminGrantFlagRef!: FirebaseRef<boolean>;

	constructor() {
		super();
		this.setDefaultConfig({
			serviceAccounts: {
				[ServiceAccountId_Bootstrap]: {
					scopes: ['permissions:admin'],
					enabled: true,
					systemOnly: true,
				}
			}
		});
	}

	protected init() {
		super.init();
		this.adminGrantFlagRef = ModuleBE_Firebase.createModuleStateFirebaseRef<boolean>(this, 'grantAdminOnLogin');
	}

	public getAdminGrantFlagRef(): FirebaseRef<boolean> {
		return this.adminGrantFlagRef;
	}

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_PermissionsRoles,
			dependsOn: [],
			processor: () => this.ensurePermissionRoles()
		}];
	}

	async ensurePermissionRoles() {
		await this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			await this.ensureScopeEntities();
			await this.createDefaultRoleFromScopeContributions();
			await this.ensurePermissionsAdminRole();
			await this.ensureDefinedRoles();
			await this.recomputePermissionsForAllUsers();
			this.logInfoBold('Recomputed UserPermissions for all users');
		});
	}

	// --- Permission recomputation (materialized DB_UserPermissions) ---

	async recomputePermissionsForUsers(accountIds: UniqueId[]): Promise<void> {
		if (!accountIds.length)
			return;

		const permissionUserIds = accountIds.map(id => stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(id));
		const permissionUsers = filterInstances(await ModuleBE_PermissionUserDB.query.all(permissionUserIds));

		const entitiesToUpsert: DB_UserPermissions[] = await Promise.all(permissionUsers.map(async user => {
			const userRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(user.roles.map(r => r.roleId)));
			const scopeEntries = await this.resolveUserScopeEntries(userRoles);
			return {
				_id: stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(user._id),
				scopeEntries,
			} as DB_UserPermissions;
		}));

		if (entitiesToUpsert.length > 0)
			await ModuleBE_UserPermissionsDB.set.all(entitiesToUpsert);
	}

	async recomputePermissionsForAllUsers(): Promise<void> {
		const allUsers = await ModuleBE_PermissionUserDB.query.where({});
		if (!allUsers.length)
			return;

		await batchActionParallel(allUsers, 50, async batch => {
			const entitiesToUpsert: DB_UserPermissions[] = await Promise.all(batch.map(async user => {
				const userRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(user.roles.map(r => r.roleId)));
				const scopeEntries = await this.resolveUserScopeEntries(userRoles);
				return {
					_id: stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(user._id),
					scopeEntries,
				} as DB_UserPermissions;
			}));

			await ModuleBE_UserPermissionsDB.set.all(entitiesToUpsert);
		});
	}

	private async resolveUserScopeEntries(userRoles: DB_PermissionRole[]): Promise<string[]> {
		const allScopeIds = filterDuplicates(userRoles.flatMap(r => r.scopeEntries ?? []));
		if (allScopeIds.length === 0)
			return [];

		const scopeEntities = filterInstances(await ModuleBE_PermissionScopeDB.query.all(allScopeIds));
		return this.deduplicateScopeEntries(scopeEntities);
	}

	private deduplicateScopeEntries(scopeEntities: DB_PermissionScope[]): string[] {
		const scopeMaxIdx: Record<string, { value: string; idx: number }> = {};
		for (const entity of scopeEntities) {
			const scopeValues = getScopeValues(entity.key);
			const valueIdx = scopeValues ? scopeValues.indexOf(entity.value) : -1;

			const current = scopeMaxIdx[entity.key];
			if (!current || valueIdx > current.idx)
				scopeMaxIdx[entity.key] = {value: entity.value, idx: valueIdx};
		}

		return _keys(scopeMaxIdx).map(k => `${k}:${scopeMaxIdx[k].value}`);
	}

	// --- Service account elevation ---

	async runAsServiceAccount<R>(saId: string, action: () => Promise<R>): Promise<R> {
		const saConfig = this.config.serviceAccounts[saId];
		if (!saConfig || !saConfig.enabled)
			throw new ApiException(403, `Service account '${saId}' is not enabled`);

		if (saConfig.systemOnly) {
			const store = MemStorage.getStore();
			if (store && MemKey_UserScopePermissions.peak() !== undefined)
				throw new ApiException(403, `System-only service account '${saId}' cannot be used within a user context`);
		}

		const scopes = saId === ServiceAccountId_Bootstrap
			? this.resolveBootstrapScopes()
			: saConfig.scopes;

		const memStorage = new MemStorage();
		return memStorage.init(async () => {
			MemKey_ServiceAccountId.set(saId);
			MemKey_UserScopePermissions.set(scopes);
			return action();
		});
	}

	private resolveBootstrapScopes(): string[] {
		const defs = getRegisteredFunctionPermissions();
		const scopeKeys = new Set(defs.map(d => d.scopeKey));
		return [...scopeKeys].map(key => {
			const values = getScopeValues(key);
			return `${key}:${values![values!.length - 1]}`;
		});
	}

	private async ensureScopeEntities() {
		const defs = getRegisteredFunctionPermissions();
		this.logDebug(`Registered function permissions: ${defs.length} definitions`);
		defs.forEach(def => this.logDebug(`  scopeKey=${def.scopeKey}  value=${def.value}`));

		const scopeMap = new Map<string, readonly string[]>();
		for (const def of defs) {
			if (scopeMap.has(def.scopeKey))
				continue;

			const values = getScopeValues(def.scopeKey);
			if (values)
				scopeMap.set(def.scopeKey, values);
		}

		this.logDebug(`Scope map: ${scopeMap.size} scopes`);
		scopeMap.forEach((values, key) => this.logDebug(`  ${key} -> [${values.join(', ')}]`));

		const scopeEntities = [...scopeMap.entries()].flatMap(([key, values]) =>
			values.map(value => ({
				_id: permissionScopeId(key, value),
				key,
				value,
			}))
		);

		if (scopeEntities.length === 0) {
			this.logDebug('No scope entities to ensure');
			return;
		}

		this.logDebug(`Writing ${scopeEntities.length} scope entities:`);
		scopeEntities.forEach(e => this.logDebug(`  _id=${e._id}  key=${e.key}  value=${e.value}`));

		await ModuleBE_PermissionScopeDB.set.all(scopeEntities);
		this.logInfoBold(`Ensured ${scopeEntities.length} scope entities`);
	}

	private async createDefaultRoleFromScopeContributions() {
		const contributions = flatArray(dispatcher_collectDefaultScopeValues.dispatchModule());
		this.logDebug(`Collected ${contributions.length} default scope contributions:`);
		contributions.forEach(c => this.logDebug(`  ${c.scope.key}:${c.value}`));

		const scopeEntries = filterDuplicates(contributions.map(grant => permissionScopeId(grant.scope.key, grant.value)));

		this.logDebug(`Default role _id=${RoleId_AppDefault}  scopeEntries=[${scopeEntries.join(', ')}]`);

		await ModuleBE_PermissionRoleDB.set.all([{
			_id: RoleId_AppDefault,
			label: 'Default',
			type: 'assignable',
			system: true,
			scopeEntries,
		}]);

		this.logInfoBold(`Default role upserted with ${scopeEntries.length} scope entries`);
	}

	private async ensurePermissionsAdminRole() {
		const defs = getRegisteredFunctionPermissions();
		const scopeKeys = new Set(defs.map(d => d.scopeKey));
		const adminScopeIds = [...scopeKeys].flatMap(key => {
			const values = getScopeValues(key);
			if (!values || values.length === 0)
				return [];

			return [permissionScopeId(key, values[values.length - 1])];
		});
		adminScopeIds.push(...PermissionRole_SuperAdmin_ScopeIds);

		const dedupedScopeIds = filterDuplicates(adminScopeIds);
		this.logDebug(`Permissions Admin role _id=${RoleId_PermissionsAdmin}  scopeEntries=[${dedupedScopeIds.join(', ')}]`);

		await ModuleBE_PermissionRoleDB.set.all([{
			_id: RoleId_PermissionsAdmin,
			label: 'Permissions Admin',
			type: 'assignable',
			system: true,
			scopeEntries: dedupedScopeIds,
		}]);

		this.logInfoBold('Permissions Admin role upserted');
	}

	private async ensureDefinedRoles() {
		const roleDefs = getRegisteredRoleDefinitions();
		if (roleDefs.length === 0)
			return;

		await ModuleBE_PermissionRoleDB.set.all(roleDefs.map(def => ({
			_id: stringToUniqueId<DatabaseDef_PermissionRole['dbKey']>(md5(`role/${def.key}`)),
			label: def.label,
			type: def.type,
			system: true as const,
			scopeEntries: filterDuplicates(def.scopes.map(({scope, value}) => permissionScopeId(scope.key, value))),
		})));

		this.logInfoBold(`Ensured ${roleDefs.length} application-defined roles: [${roleDefs.map(d => d.label).join(', ')}]`);
	}
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();
