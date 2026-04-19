import {_keys, ApiException, batchActionParallel, Dispatcher, filterDuplicates, filterInstances, flatArray, Module, UniqueId} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import {hashToUniqueId, stringToUniqueId} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {RuntimeBE_ModulesDB} from '@nu-art/db-api-backend';
import type {
	DatabaseDef_AccessGroup,
	DatabaseDef_PermissionScope,
	DatabaseDef_UserPermissions,
	DB_AccessGroup,
	DB_PermissionScope,
	DB_UserPermissions,
	DocumentAccessFields,
	DocumentAccessInner,
	ScopedAccessIds
} from '@nu-art/permissions-shared';
import {AccessScope_Self, AllDocumentAccessKeys, getAllRegisteredScopes, getRegisteredGroupDefinitions, permissionScopeId} from '@nu-art/permissions-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {getPermissionScopeValues} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionScopeDB} from '../_entity/permission-scope/ModuleBE_PermissionScopeDB.js';
import {ModuleBE_UserPermissionsDB} from '../_entity/user-permissions/ModuleBE_UserPermissionsDB.js';
import type {OnAccessGroupChanged} from '../_entity/access-group/ModuleBE_AccessGroupDB.js';
import {ModuleBE_AccessGroupDB} from '../_entity/access-group/ModuleBE_AccessGroupDB.js';
import {FirebaseRef, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {MemKey_ServiceAccountId, MemKey_UserAccessIds, MemKey_UserScopePermissions} from '../consts.js';
import {type AccessContextResolver, wireDocumentAccess} from '../document-access-enforcement.js';
import {ModuleBE_AccountDB, OnAccountDeleted, OnUserLogin} from '@nu-art/user-account-backend';
import {SafeDB_Account} from '@nu-art/user-account-shared';


// --- Dispatcher for additional group memberships on registration/login ---

export interface ResolveAdditionalGroupMemberships {
	__resolveAdditionalGroupMemberships(accountId: string, context: 'register' | 'login'): Promise<UniqueId[]>;
}

// --- Service account config ---

export type ServiceAccountConfig = {
	readonly scopes: string[];
	readonly enabled: boolean;
	readonly systemOnly: boolean;
};

export const ServiceAccountId_Bootstrap = 'bootstrap-admin';

type Config = {
	serviceAccounts: Record<string, ServiceAccountConfig>;
};

// --- Well-known group IDs ---

export const GroupId_AppDefault = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/default');
export const GroupId_PermissionsAdmin = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/permissions-admin');
const BootstrapSAGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(ServiceAccountId_Bootstrap);

export const PermissionsInfraGroupIds: Record<keyof DocumentAccessInner, DatabaseDef_AccessGroup['id']> = AllDocumentAccessKeys.reduce((ids, key) => {
	ids[key] = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`permissions-infra:${key}`);
	return ids;
}, {} as Record<keyof DocumentAccessInner, DatabaseDef_AccessGroup['id']>);

// --- Module ---

const dispatcher_resolveAdditionalGroupMemberships = new Dispatcher<ResolveAdditionalGroupMemberships, '__resolveAdditionalGroupMemberships'>('__resolveAdditionalGroupMemberships');

export const SetupTaskKey_PermissionsGroups = asSetupTaskKey('permissions-groups');

class ModuleBE_Permissions_Class
	extends Module<Config>
	implements PerformProjectSetup, OnAccessGroupChanged, OnUserLogin, OnAccountDeleted {

	private adminGrantFlagRef!: FirebaseRef<boolean>;
	private readonly accessResolvers = new Map<string, AccessContextResolver<any>>();
	private readonly moduleScopeKeys = new Map<string, string[]>();

	constructor() {
		super();
		this.setDefaultConfig({
			serviceAccounts: {
				[ServiceAccountId_Bootstrap]: {
					scopes: ['permissions-ui:view', 'access-group:create'],
					enabled: true,
					systemOnly: true,
				}
			}
		});
	}

	private readonly permissionsAccessResolver = (item: any): DocumentAccessFields => {
		if (item._id === BootstrapSAGroupId)
			return {
				__access: {
					readers: [BootstrapSAGroupId],
					writers: [BootstrapSAGroupId],
					deleters: [],
					owners: [],
				}
			};

		return {
			__access: {
				readers: [GroupId_PermissionsAdmin],
				writers: [GroupId_PermissionsAdmin],
				deleters: [],
				owners: [],
			}
		};
	};

	protected init() {
		super.init();
		this.adminGrantFlagRef = ModuleBE_Firebase.createModuleStateFirebaseRef<boolean>(this, 'grantAdminOnLogin');
		this.setAccessContextResolver(ModuleBE_AccessGroupDB, this.permissionsAccessResolver);
		this.setAccessContextResolver(ModuleBE_PermissionScopeDB, this.permissionsAccessResolver);
		this.setAccessContextResolver(ModuleBE_UserPermissionsDB, this.permissionsAccessResolver);
		this.wireDocumentAccessToAllModules();
	}

	setAccessContextResolver<Database extends DB_Prototype>(
		dbModule: ModuleBE_BaseDB<Database>,
		resolver: AccessContextResolver<Database>,
		scopeKeys?: string[]
	): void {
		this.accessResolvers.set(dbModule.dbDef.dbKey, resolver);
		if (scopeKeys)
			this.moduleScopeKeys.set(dbModule.dbDef.dbKey, scopeKeys);
	}

	private wireDocumentAccessToAllModules() {
		for (const dbModule of RuntimeBE_ModulesDB()) {
			const dbKey = dbModule.dbDef.dbKey;
			wireDocumentAccess(
				dbModule,
				() => this.accessResolvers.get(dbKey),
				() => this.moduleScopeKeys.get(dbKey)
			);
		}
	}

	public getAdminGrantFlagRef(): FirebaseRef<boolean> {
		return this.adminGrantFlagRef;
	}

	// --- Project setup ---

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_PermissionsGroups,
			dependsOn: [],
			processor: () => this.ensureDefinedGroups()
		}];
	}

	async ensureDefinedGroups() {
		await this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			this.logDebug('[FIRST_USER] bootstrap: starting ensureDefinedGroups');
			await this.ensureBootstrapSAAccessGroup();
			await this.ensureServiceAccountAccessGroups();
			await this.ensurePermissionsInfraAccessGroups();
			await this.ensureScopeEntities();
			await this.ensureDefaultGroup();
			await this.ensurePermissionsAdminGroup();
			await this.ensureAppDefinedGroups();
			await this.syncPersonalGroupsForExistingAccounts();
			await this.recomputePermissionsForAllUsers();
			this.logInfoBold('Recomputed UserPermissions for all users');
			this.logDebug('[FIRST_USER] bootstrap: ensureDefinedGroups complete');
		});
	}

	// --- Account lifecycle hooks ---

	async __onUserLogin(account: SafeDB_Account) {
		await this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			await this.ensurePersonalAccessGroup(account);
			await this.addToDefaultGroup(account);
			await this.promoteIfNoAdmin(account);
			await this.checkAdminGrantFlag(account);
			await this.resolveAdditionalGroupMemberships(account, 'login');
			await this.recomputePermissionsForUsers([account._id]);
		});
	}

	async __onAccountDeleted(account: SafeDB_Account) {
		await this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
			const personalGroup = await ModuleBE_AccessGroupDB.query.unique(personalGroupId);
			if (personalGroup)
				await ModuleBE_AccessGroupDB.delete.unique(personalGroupId);

			const userPermId = stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(account._id);
			const userPerm = await ModuleBE_UserPermissionsDB.query.unique(userPermId);
			if (userPerm)
				await ModuleBE_UserPermissionsDB.delete.unique(userPermId);

			const allGroups = await ModuleBE_AccessGroupDB.query.where({});
			const groupsContainingUser = allGroups.filter(g => g.members.includes(personalGroupId));
			for (const group of groupsContainingUser) {
				group.members = group.members.filter(m => m !== personalGroupId);
				await ModuleBE_AccessGroupDB.set.item(group);
			}
		});
	}

	private async ensurePersonalAccessGroup(account: SafeDB_Account) {
		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
		const existing = await ModuleBE_AccessGroupDB.query.unique(personalGroupId);
		this.logDebug(`[FIRST_USER] ensurePersonalAccessGroup: personalGroupId=${personalGroupId}, existing=${!!existing}`);
		if (existing)
			return;

		await ModuleBE_AccessGroupDB.create.item({
			_id: personalGroupId,
			type: 'user',
			key: AccessScope_Self,
			label: `User (${account.email ?? account._id})`,
			members: [],
		});
		const verify = await ModuleBE_AccessGroupDB.query.unique(personalGroupId);
		this.logDebug(`[FIRST_USER] ensurePersonalAccessGroup: created, verified=${!!verify}`);
	}

	private async addToDefaultGroup(account: SafeDB_Account) {
		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
		const defaultGroup = await ModuleBE_AccessGroupDB.query.unique(GroupId_AppDefault);
		this.logDebug(`[FIRST_USER] addToDefaultGroup: defaultGroup=${!!defaultGroup}, members=${defaultGroup?.members?.length}`);
		if (!defaultGroup)
			return;

		if (defaultGroup.members.includes(personalGroupId))
			return;

		defaultGroup.members.push(personalGroupId);
		await ModuleBE_AccessGroupDB.set.item(defaultGroup);
		this.logDebug(`[FIRST_USER] addToDefaultGroup: user added, members now=${defaultGroup.members.length}`);
	}

	private async promoteIfNoAdmin(account: SafeDB_Account) {
		const adminGroup = await ModuleBE_AccessGroupDB.query.unique(GroupId_PermissionsAdmin);
		this.logDebug(`[FIRST_USER] promoteIfNoAdmin: adminGroup=${!!adminGroup}, members=${JSON.stringify(adminGroup?.members)}`);
		if (!adminGroup) {
			this.logDebug('[FIRST_USER] promoteIfNoAdmin: NO admin group found — returning');
			return;
		}

		const hasRealMembers = adminGroup.members.some(m => m !== BootstrapSAGroupId);
		if (hasRealMembers) {
			this.logDebug(`[FIRST_USER] promoteIfNoAdmin: admin already has non-SA members — returning`);
			return;
		}

		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
		if (adminGroup.members.includes(personalGroupId))
			return;

		adminGroup.members.push(personalGroupId);
		await ModuleBE_AccessGroupDB.set.item(adminGroup);
		this.logDebug(`[FIRST_USER] promoteIfNoAdmin: promoted ${personalGroupId} to admin`);
	}

	private async checkAdminGrantFlag(account: SafeDB_Account) {
		const flagValue = await this.adminGrantFlagRef.get(false);
		if (!flagValue)
			return;

		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
		const adminGroup = await ModuleBE_AccessGroupDB.query.unique(GroupId_PermissionsAdmin);
		if (!adminGroup)
			return;

		if (adminGroup.members.includes(personalGroupId)) {
			await this.adminGrantFlagRef.set(false);
			return;
		}

		adminGroup.members.push(personalGroupId);
		await ModuleBE_AccessGroupDB.set.item(adminGroup);
		await this.adminGrantFlagRef.set(false);
		this.logInfo(`Granted Permissions Admin to user ${account._id} via RTDB flag (one-shot)`);
	}

	private async resolveAdditionalGroupMemberships(account: SafeDB_Account, context: 'register' | 'login') {
		const results: UniqueId[][] = await dispatcher_resolveAdditionalGroupMemberships.dispatchModuleAsync(account._id, context);
		const additionalGroupIds = filterDuplicates(flatArray(results));
		if (additionalGroupIds.length === 0)
			return;

		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(account._id);
		const typedGroupIds = additionalGroupIds.map(id => stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(id));
		const groups = filterInstances(await ModuleBE_AccessGroupDB.query.all(typedGroupIds));

		const modifiedGroups = groups.filter(group => !group.members.includes(personalGroupId));
		if (modifiedGroups.length === 0)
			return;

		modifiedGroups.forEach(group => group.members.push(personalGroupId));
		await ModuleBE_AccessGroupDB.set.all(modifiedGroups);
		modifiedGroups.forEach(group => this.logInfo(`Added user ${account._id} to group '${group.label}'`));
	}

	// --- Permission recomputation (materialized DB_UserPermissions) ---

	async recomputePermissionsForUsers(accountIds: UniqueId[]): Promise<void> {
		if (!accountIds.length)
			return;

		const allGroups = await ModuleBE_AccessGroupDB.query.where({});
		this.logDebug(`[FIRST_USER] recomputePermissionsForUsers: accountIds=${JSON.stringify(accountIds)}, allGroups=${allGroups.length}`);

		const entitiesToUpsert: DB_UserPermissions[] = await Promise.all(accountIds.map(async accountId => {
			const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(accountId);
			const {scopeEntries, accessIds} = await this.materializeFromGroups(personalGroupId, allGroups);
			this.logDebug(`[FIRST_USER] materialized for ${accountId}: scopes=${scopeEntries.length}, accessIds=${JSON.stringify(accessIds)}`);
			return {
				_id: stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(accountId),
				scopeEntries,
				accessIds,
			} as DB_UserPermissions;
		}));

		if (entitiesToUpsert.length > 0)
			await ModuleBE_UserPermissionsDB.set.all(entitiesToUpsert);
	}

	async recomputePermissionsForAllUsers(): Promise<void> {
		const allGroups = await ModuleBE_AccessGroupDB.query.where({});
		const userGroups = allGroups.filter(g => g.type === 'user');
		if (!userGroups.length)
			return;

		await batchActionParallel(userGroups, 50, async batch => {
			const entitiesToUpsert: DB_UserPermissions[] = await Promise.all(batch.map(async pg => {
				const {scopeEntries, accessIds} = await this.materializeFromGroups(pg._id, allGroups);
				return {
					_id: stringToUniqueId<DatabaseDef_UserPermissions['dbKey']>(pg._id),
					scopeEntries,
					accessIds,
				} as DB_UserPermissions;
			}));

			await ModuleBE_UserPermissionsDB.set.all(entitiesToUpsert);
		});
	}

	private async materializeFromGroups(personalGroupId: UniqueId, allGroups: DB_AccessGroup[]): Promise<{ scopeEntries: string[]; accessIds: ScopedAccessIds }> {
		const personalGroup = allGroups.find(g => g._id === personalGroupId);
		const accessIds: ScopedAccessIds = {
			[AccessScope_Self]: [personalGroupId],
		};

		if (!personalGroup)
			return {scopeEntries: [], accessIds};

		const reachableGroups = this.walkGroupGraphUp(personalGroupId, allGroups);

		const allScopeIds: UniqueId[] = [];
		if (personalGroup.scopeEntries?.length)
			allScopeIds.push(...personalGroup.scopeEntries);

		for (const group of reachableGroups) {
			if (!accessIds[group.key])
				accessIds[group.key] = [];

			accessIds[group.key] = filterDuplicates([...accessIds[group.key], group._id]);

			if (group.scopeEntries?.length)
				allScopeIds.push(...group.scopeEntries);
		}

		const dedupedScopeIds = filterDuplicates(allScopeIds);
		const scopeEntries = dedupedScopeIds.length > 0
			? await this.resolveScopeIdsToStrings(dedupedScopeIds)
			: [];

		return {scopeEntries, accessIds};
	}

	// --- Access group change handler ---

	async __onAccessGroupChanged(changedGroupIds: UniqueId[]): Promise<void> {
		await this.rematerializeForGroups(changedGroupIds);
	}

	async rematerializeForGroups(changedGroupIds: UniqueId[]): Promise<void> {
		const allGroups = await ModuleBE_AccessGroupDB.query.where({});
		const userGroups = allGroups.filter(g => g.type === 'user');

		const affectedAccountIds: UniqueId[] = [];
		for (const personalGroup of userGroups) {
			const reachable = this.walkGroupGraphUp(personalGroup._id, allGroups);
			const isAffected = reachable.some(g => changedGroupIds.includes(g._id));
			if (isAffected)
				affectedAccountIds.push(personalGroup._id);
		}

		if (affectedAccountIds.length > 0)
			await this.recomputePermissionsForUsers(affectedAccountIds);
	}

	private walkGroupGraphUp(startGroupId: UniqueId, allGroups: DB_AccessGroup[]): DB_AccessGroup[] {
		const visited = new Set<UniqueId>();
		const queue: UniqueId[] = [startGroupId];
		const result: DB_AccessGroup[] = [];

		while (queue.length > 0) {
			const currentId = queue.shift()!;
			if (visited.has(currentId))
				continue;

			visited.add(currentId);

			const parents = allGroups.filter(g => g.members.includes(currentId));
			for (const parent of parents) {
				result.push(parent);
				queue.push(parent._id);
			}
		}

		return result;
	}

	private async resolveScopeIdsToStrings(scopeIds: UniqueId[]): Promise<string[]> {
		const typedScopeIds = scopeIds.map(id => stringToUniqueId<DatabaseDef_PermissionScope['dbKey']>(id));
		const scopeEntities = filterInstances(await ModuleBE_PermissionScopeDB.query.all(typedScopeIds));
		return this.deduplicateScopeEntries(scopeEntities);
	}

	private deduplicateScopeEntries(scopeEntities: DB_PermissionScope[]): string[] {
		const scopeMaxIdx: Record<string, { value: string; idx: number }> = {};
		for (const entity of scopeEntities) {
			const scopeValues = getPermissionScopeValues(entity.key);
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

		const personalGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(saId);
		const accessIds = saId === ServiceAccountId_Bootstrap
			? this.resolveBootstrapAccessIds()
			: await this.resolveSAAccessIds(personalGroupId);

		const memStorage = new MemStorage();
		return memStorage.init(async () => {
			MemKey_ServiceAccountId.set(saId);
			MemKey_UserScopePermissions.set(scopes);
			MemKey_UserAccessIds.set(accessIds);
			return action();
		});
	}

	private async resolveSAAccessIds(personalGroupId: UniqueId): Promise<ScopedAccessIds> {
		return this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			const allGroups = await ModuleBE_AccessGroupDB.query.where({});
			const {accessIds} = await this.materializeFromGroups(personalGroupId, allGroups);
			return accessIds;
		});
	}

	private resolveBootstrapAccessIds(): ScopedAccessIds {
		return {
			[AccessScope_Self]: [BootstrapSAGroupId],
			'permissions-admin': [GroupId_PermissionsAdmin],
		};
	}

	private resolveBootstrapScopes(): string[] {
		return [
			'permissions-ui:view',
			'access-group:create',
		];
	}

	// --- Bootstrap: ensure service account access group ---

	private async ensureBootstrapSAAccessGroup() {
		const existing = await ModuleBE_AccessGroupDB.query.unique(BootstrapSAGroupId);
		if (existing)
			return;

		await ModuleBE_AccessGroupDB.create.item({
			_id: BootstrapSAGroupId,
			type: 'service-account',
			key: ServiceAccountId_Bootstrap,
			label: 'Bootstrap Admin (SA)',
			members: [],
		});
		this.logInfoBold('Created bootstrap service account access group');
	}

	private async ensureServiceAccountAccessGroups() {
		const saKeys = _keys(this.config.serviceAccounts).filter(saId => saId !== ServiceAccountId_Bootstrap);
		if (saKeys.length === 0)
			return;

		const entries = saKeys.map(saId => ({
			saId,
			groupId: hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(saId),
		}));

		const existing = filterInstances(await ModuleBE_AccessGroupDB.query.all(entries.map(e => e.groupId)));
		const existingIds = new Set(existing.map(g => g._id));

		const toCreate = entries
			.filter(e => !existingIds.has(e.groupId))
			.map(e => ({
				_id: e.groupId,
				type: 'service-account' as const,
				key: e.saId,
				label: `SA: ${e.saId}`,
				members: [],
			}));

		if (toCreate.length === 0)
			return;

		await ModuleBE_AccessGroupDB.create.all(toCreate);
		this.logInfoBold(`Created ${toCreate.length} service account access groups`);
	}

	// --- Bootstrap: ensure permissions infrastructure access groups ---

	private async ensurePermissionsInfraAccessGroups() {
		const entries = AllDocumentAccessKeys.map(accessKey => ({
			accessKey,
			groupId: PermissionsInfraGroupIds[accessKey],
		}));

		const existing = filterInstances(await ModuleBE_AccessGroupDB.query.all(entries.map(e => e.groupId)));
		const existingMap = new Map(existing.map(g => [g._id, g]));

		const items = entries.map(e => {
			const existingGroup = existingMap.get(e.groupId);
			const members = filterDuplicates([GroupId_PermissionsAdmin, ...(existingGroup?.members ?? [])]);
			return {
				_id: e.groupId,
				type: 'entity' as const,
				key: 'permissions',
				label: `Permissions Infra ${e.accessKey}`,
				members,
			};
		});

		await ModuleBE_AccessGroupDB.set.all(items);
		this.logInfoBold('Ensured permissions infrastructure access groups');
	}

	// --- Bootstrap: ensure scope entities ---

	private async ensureScopeEntities() {
		const registeredScopes = getAllRegisteredScopes();
		this.logDebug(`Registered scopes: ${registeredScopes.length} definitions`);

		const scopeEntities = registeredScopes.flatMap(scope =>
			scope.values.map(value => ({
				_id: permissionScopeId(scope.key, value),
				key: scope.key,
				value,
			}))
		);

		if (scopeEntities.length === 0)
			return;

		await ModuleBE_PermissionScopeDB.set.all(scopeEntities);
		this.logInfoBold(`Ensured ${scopeEntities.length} scope entities`);
	}

	// --- Bootstrap: ensure default group ---

	private async ensureDefaultGroup() {
		const existing = await ModuleBE_AccessGroupDB.query.unique(GroupId_AppDefault);
		await ModuleBE_AccessGroupDB.set.all([{
			_id: GroupId_AppDefault,
			type: 'custom' as const,
			key: 'default',
			label: 'Default',
			members: existing?.members ?? [],
			scopeEntries: [],
		}]);

		this.logInfoBold('Default group ensured');
	}

	// --- Bootstrap: permissions admin group ---

	private async ensurePermissionsAdminGroup() {
		const scopeEntries = [
			permissionScopeId('permissions-ui', 'view'),
			permissionScopeId('access-group', 'create'),
		];

		const existingAdmin = await ModuleBE_AccessGroupDB.query.unique(GroupId_PermissionsAdmin);
		const adminMembers = filterDuplicates([BootstrapSAGroupId, ...(existingAdmin?.members ?? [])]);
		this.logDebug(`[FIRST_USER] ensurePermissionsAdminGroup: id=${GroupId_PermissionsAdmin}, existing=${!!existingAdmin}, members=${JSON.stringify(adminMembers)}, scopes=${scopeEntries.length}`);
		await ModuleBE_AccessGroupDB.set.all([{
			_id: GroupId_PermissionsAdmin,
			type: 'custom' as const,
			key: 'permissions-admin',
			label: 'Permissions Admin',
			members: adminMembers,
			scopeEntries,
		}]);

		this.logInfoBold('Permissions Admin group upserted');
	}

	// --- Bootstrap: app-defined groups ---

	private async ensureAppDefinedGroups() {
		const groupDefs = getRegisteredGroupDefinitions();
		if (groupDefs.length === 0)
			return;

		const entries = groupDefs.map(def => ({
			def,
			groupId: hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`group/${def.key}`),
		}));

		const existing = filterInstances(await ModuleBE_AccessGroupDB.query.all(entries.map(e => e.groupId)));
		const existingMap = new Map(existing.map(g => [g._id, g]));

		const items = entries.map(e => {
			const existingGroup = existingMap.get(e.groupId);
			const declaredMemberIds = (e.def.memberKeys ?? []).map(key =>
				hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`group/${key}`)
			);
			const mergedMembers = filterDuplicates([...declaredMemberIds, ...(existingGroup?.members ?? [])]);
			return {
				_id: e.groupId,
				type: 'custom' as const,
				key: e.def.scopeKey ?? e.def.key,
				label: e.def.label,
				members: mergedMembers,
				scopeEntries: filterDuplicates(e.def.scopes.map(({scope, value}) => permissionScopeId(scope.key, value))),
			};
		});

		await ModuleBE_AccessGroupDB.set.all(items);
		this.logInfoBold(`Ensured ${groupDefs.length} application-defined groups: [${groupDefs.map(d => d.label).join(', ')}]`);
	}

	// --- Bootstrap: sync personal groups for existing accounts ---

	private async syncPersonalGroupsForExistingAccounts() {
		const accounts = await ModuleBE_AccountDB.query.where({});
		this.logDebug(`Found ${accounts.length} accounts for personal group sync`);

		for (const account of accounts)
			await this.ensurePersonalAccessGroup(account);
	}
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();
