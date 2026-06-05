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
import {FirebaseRef, ModuleBE_Firebase, MongoCollection} from '@nu-art/firebase-backend';
import {MemKey_ServiceAccountId, MemKey_UserAccessIds, MemKey_UserScopePermissions} from '../consts.js';
import {type AccessContextResolver, wireDocumentAccess} from '../document-access-enforcement.js';
import {ModuleBE_AccountDB, OnAccountDeleted, OnUserLogin} from '@nu-art/user-account-backend';
import {DB_Account} from '@nu-art/user-account-shared';
import {HttpCodes} from '@nu-art/api-types';

export type ShareAccessContext = Partial<DocumentAccessInner>;


// --- Dispatcher for additional group memberships on registration/login ---

export interface ResolveAdditionalGroupMemberships {
	__resolveAdditionalGroupMemberships(accountId: string, context: 'register' | 'login'): Promise<UniqueId[]>;
}

// --- Service account config ---

/**
 * Per-SA access-ID cache directive. A single source of truth for the caching
 * behavior of one service account — the two modes are mutually exclusive by
 * construction, so the knobs can never conflict:
 *  - `{immutable: true}` — the SA's group membership is immutable by system
 *    design; the materialized access-IDs never expire by time and are
 *    invalidated ONLY by `__onAccessGroupChanged`.
 *  - `{ttlMs}` — a per-SA time-to-live override (for SAs whose membership may
 *    change). When omitted entirely, the global default TTL applies.
 */
export type SAAccessIdCacheDirective =
	| { immutable: true }
	| { ttlMs: number };

export type ServiceAccountConfig = {
	readonly scopes: string[];
	readonly enabled: boolean;
	readonly systemOnly: boolean;
	readonly accessIdCache?: SAAccessIdCacheDirective;
};

export const ServiceAccountId_Bootstrap = 'bootstrap-admin';

type Config = {
	serviceAccounts: Record<string, ServiceAccountConfig>;
	saAccessIdCacheTtlMs?: number;
};

type SAAccessIdCacheEntry = { value: ScopedAccessIds; expiresAt: number };

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
	// Per-entry expiry cache (keyed by SA personal group id). Each entry carries
	// its own `expiresAt` so different SAs can have different TTLs — or no time
	// expiry at all (immutable SAs use Number.POSITIVE_INFINITY). Invalidated
	// wholesale by __onAccessGroupChanged.
	private readonly saAccessIdCache = new Map<UniqueId, SAAccessIdCacheEntry>();

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
				readers: [GroupId_PermissionsAdmin, item._id],
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

	// --- Share API ---

	public async share(dbKey: string, entityId: UniqueId, accessContext: ShareAccessContext): Promise<void> {
		const dbModule = this.resolveDbModule(dbKey);
		const mongoCol = this.assertMongoCollection(dbModule);

		const entity = await this.loadEntityUnmanipulated(mongoCol, entityId, dbKey);
		this.assertShareAccess(entity);

		const addToSet = this.buildAddToSetUpdate(accessContext);
		if (!addToSet)
			return;

		const result = await mongoCol.mongoCollection.updateOne(
			{_id: entityId} as any,
			{$addToSet: addToSet}
		);

		if (result.matchedCount === 0)
			throw HttpCodes._4XX.NOT_FOUND(`Entity disappeared during share: ${dbKey}/${entityId}`);
	}

	private resolveDbModule(dbKey: string): ModuleBE_BaseDB<any> {
		const dbModule = RuntimeBE_ModulesDB().find(m => m.dbDef.dbKey === dbKey);
		if (!dbModule)
			throw HttpCodes._4XX.BAD_REQUEST(`No DB module registered for dbKey '${dbKey}'`);

		return dbModule;
	}

	private assertMongoCollection(dbModule: ModuleBE_BaseDB<any>): MongoCollection<any> {
		if (!(dbModule.collection instanceof MongoCollection))
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR('Share API requires MongoDB backend');

		return dbModule.collection;
	}

	private async loadEntityUnmanipulated(mongoCol: MongoCollection<any>, entityId: UniqueId, dbKey: string): Promise<Record<string, any>> {
		const results = await mongoCol.query.unManipulatedQuery({where: {_id: entityId} as any, limit: 1});
		if (!results.length)
			throw HttpCodes._4XX.NOT_FOUND(`Entity not found: ${dbKey}/${entityId}`);

		return results[0];
	}

	private assertShareAccess(entity: Record<string, any>): void {
		if (MemKey_ServiceAccountId.peak())
			return;

		const scopedDict = MemKey_UserAccessIds.peak();
		if (!scopedDict)
			throw HttpCodes._4XX.FORBIDDEN('No access context — cannot share');

		const callerIds = filterDuplicates(Object.values(scopedDict).flat());
		const access: Partial<DocumentAccessInner> | undefined = entity.__access;
		const hasWriteAccess = access?.writers?.some(id => callerIds.includes(id))
			|| access?.owners?.some(id => callerIds.includes(id));

		if (!hasWriteAccess)
			throw HttpCodes._4XX.FORBIDDEN('Write access required to share a document');
	}

	private buildAddToSetUpdate(accessContext: ShareAccessContext): Record<string, { $each: UniqueId[] }> | undefined {
		const update: Record<string, { $each: UniqueId[] }> = {};

		for (const key of AllDocumentAccessKeys) {
			const groupIds = accessContext[key];
			if (!groupIds?.length)
				continue;

			update[`__access.${key}`] = {$each: groupIds};
		}

		return _keys(update).length > 0 ? update : undefined;
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

	async __onUserLogin(account: DB_Account) {
		this.logDebug(`__onUserLogin: processing permissions for _id='${account._id}' email='${account.email}'`);
		await this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			await this.ensurePersonalAccessGroup(account);
			this.logDebug(`__onUserLogin: ensurePersonalAccessGroup done`);
			await this.addToDefaultGroup(account);
			this.logDebug(`__onUserLogin: addToDefaultGroup done`);
			await this.promoteIfNoAdmin(account);
			this.logDebug(`__onUserLogin: promoteIfNoAdmin done`);
			await this.checkAdminGrantFlag(account);
			this.logDebug(`__onUserLogin: checkAdminGrantFlag done`);
			await this.resolveAdditionalGroupMemberships(account, 'login');
			this.logDebug(`__onUserLogin: resolveAdditionalGroupMemberships done`);
			await this.recomputePermissionsForUsers([account._id]);
			this.logDebug(`__onUserLogin: recomputePermissionsForUsers done`);
		});
	}

	async __onAccountDeleted(account: DB_Account) {
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

	private async ensurePersonalAccessGroup(account: DB_Account) {
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

	private async addToDefaultGroup(account: DB_Account) {
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

	private async promoteIfNoAdmin(account: DB_Account) {
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

	private async checkAdminGrantFlag(account: DB_Account) {
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

	private async resolveAdditionalGroupMemberships(account: DB_Account, context: 'register' | 'login') {
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
		// Single correctness mechanism for immutable SAs: clearing the cache here
		// forces every SA (including immutable ones with no time expiry) to
		// re-materialize its access-ids on the next resolve.
		this.logDebug(`__onAccessGroupChanged: clearing SA access-id cache (${this.saAccessIdCache.size} entries) for ${changedGroupIds.length} changed groups`);
		this.saAccessIdCache.clear();
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
			if (store && MemKey_ServiceAccountId.peak() === undefined && MemKey_UserScopePermissions.peak() !== undefined)
				throw new ApiException(403, `System-only service account '${saId}' cannot be used within a user context`);
		}

		const scopes = saId === ServiceAccountId_Bootstrap
			? this.resolveBootstrapScopes()
			: saConfig.scopes;

		const personalGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(saId);
		const accessIds = saId === ServiceAccountId_Bootstrap
			? this.resolveBootstrapAccessIds()
			: await this.resolveSAAccessIds(personalGroupId, saConfig.accessIdCache);

		const memStorage = new MemStorage();
		return memStorage.init(async () => {
			MemKey_ServiceAccountId.set(saId);
			MemKey_UserScopePermissions.set(scopes);
			MemKey_UserAccessIds.set(accessIds);
			return action();
		});
	}

	private async resolveSAAccessIds(personalGroupId: UniqueId, directive?: SAAccessIdCacheDirective): Promise<ScopedAccessIds> {
		const cached = this.getCachedSAAccessIds(personalGroupId);
		if (cached) {
			this.logDebug(`resolveSAAccessIds: cache hit for SA group ${personalGroupId}`);
			return cached;
		}

		this.logDebug(`resolveSAAccessIds: cache miss for SA group ${personalGroupId} — materializing`);
		return this.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			const allGroups = await ModuleBE_AccessGroupDB.query.where({});
			const {accessIds} = await this.materializeFromGroups(personalGroupId, allGroups);
			return this.setCachedSAAccessIds(personalGroupId, accessIds, directive);
		});
	}

	/**
	 * Read a cached SA access-id entry, honoring its per-entry expiry. Immutable
	 * entries (expiresAt === Infinity) never expire by time. Expired entries are
	 * evicted on access.
	 */
	private getCachedSAAccessIds(personalGroupId: UniqueId): ScopedAccessIds | undefined {
		const entry = this.saAccessIdCache.get(personalGroupId);
		if (!entry)
			return undefined;

		if (Date.now() > entry.expiresAt) {
			this.saAccessIdCache.delete(personalGroupId);
			return undefined;
		}

		return entry.value;
	}

	private setCachedSAAccessIds(personalGroupId: UniqueId, value: ScopedAccessIds, directive?: SAAccessIdCacheDirective): ScopedAccessIds {
		this.saAccessIdCache.set(personalGroupId, {value, expiresAt: this.computeCacheExpiry(directive)});
		return value;
	}

	/**
	 * Effective expiry timestamp for a cache entry. Precedence (SSOT):
	 *  1. `{immutable: true}`  -> never expires by time (only on group change).
	 *  2. `{ttlMs}`            -> per-SA TTL override.
	 *  3. no directive         -> global default (`saAccessIdCacheTtlMs`, 60s).
	 */
	private computeCacheExpiry(directive?: SAAccessIdCacheDirective): number {
		if (directive && 'immutable' in directive)
			return Number.POSITIVE_INFINITY;

		const ttlMs = directive && 'ttlMs' in directive
			? directive.ttlMs
			: (this.config.saAccessIdCacheTtlMs ?? 60_000);

		return Date.now() + ttlMs;
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
