import {
	_keys,
	Dispatcher,
	filterDuplicates,
	filterInstances,
	flatArray,
	Module,
} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {
	ApiDef_Permissions,
	DatabaseDef_PermissionUser,
	GroupId_Default,
	GroupId_PermissionsAdmin,
	SessionData_Permissions,
} from '@nu-art/permissions-shared';
import type {CollectDefaultScopeValues, PerformProjectSetup, RegisteredScope} from '@nu-art/permissions-shared';
import {BaseSessionClaims, CollectSessionData, MemKey_AccountId} from '@nu-art/user-account-backend';
import {getRegisteredFunctionPermissions, getScopeValues} from '../core/function-permission-registry.js';
import {ModuleBE_PermissionGroupDB, ModuleBE_PermissionUserDB} from '../_entity.js';
import {ModuleBE_Firebase, FirebaseRef} from '@nu-art/firebase-backend';

const dispatcher_collectDefaultScopeValues = new Dispatcher<CollectDefaultScopeValues, '__collectDefaultScopeValues'>('__collectDefaultScopeValues');

export const PermissionGroup_SuperAdmin_ScopeEntries = ['permissions:admin'];

class ModuleBE_Permissions_Class
	extends Module
	implements CollectSessionData<SessionData_Permissions>, PerformProjectSetup {

	private adminGrantFlagRef!: FirebaseRef<boolean>;

	protected init() {
		super.init();
		this.adminGrantFlagRef = ModuleBE_Firebase.createModuleStateFirebaseRef<boolean>(this, 'grantAdminOnLogin');
	}

	public getAdminGrantFlagRef(): FirebaseRef<boolean> {
		return this.adminGrantFlagRef;
	}

	@ApiHandler(ApiDef_Permissions.setupPermissions)
	async setupPermissions(_params?: unknown): Promise<void> {
		await this.__performProjectSetup().processor();
	}

	@ApiHandler(ApiDef_Permissions.getRegisteredScopes)
	async getRegisteredScopes(_params?: unknown): Promise<RegisteredScope[]> {
		const defs = getRegisteredFunctionPermissions();
		const scopeMap = new Map<string, readonly string[]>();
		for (const def of defs) {
			if (scopeMap.has(def.scopeKey))
				continue;

			const values = getScopeValues(def.scopeKey);
			if (values)
				scopeMap.set(def.scopeKey, values);
		}

		return [...scopeMap.entries()].map(([key, values]) => ({key, values}));
	}

	async __collectSessionData(data: BaseSessionClaims): Promise<SessionData_Permissions> {
		const permissionUserId = data.accountId as unknown as DatabaseDef_PermissionUser['id'];
		const permissionUser = await ModuleBE_PermissionUserDB.query.uniqueAssert(permissionUserId);
		const userGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(permissionUser.groups.map(g => g.groupId)));
		const scopeEntries = this.getUserScopeEntries(userGroups);

		return {
			key: 'permissions', value: {
				scopeEntries,
				roles: userGroups.map(group => ({key: group.label, uiLabel: group.uiLabel})),
			}
		};
	}

	/**
	 * Builds a flat string[] of 'scopeKey:value' entries from the user's groups.
	 * For each scope, takes the max value across all groups (by position in the scope's values array).
	 */
	private getUserScopeEntries(userGroups: import('@nu-art/permissions-shared').DB_PermissionGroup[]): string[] {
		const allEntries = userGroups.flatMap(g => g.scopeEntries ?? []);
		if (allEntries.length === 0)
			return [];

		const scopeMaxIdx: Record<string, { value: string; idx: number }> = {};
		for (const entry of allEntries) {
			const colonIdx = entry.indexOf(':');
			if (colonIdx === -1)
				continue;

			const scopeKey = entry.substring(0, colonIdx);
			const value = entry.substring(colonIdx + 1);
			const scopeValues = getScopeValues(scopeKey);
			const valueIdx = scopeValues ? scopeValues.indexOf(value) : -1;

			const current = scopeMaxIdx[scopeKey];
			if (!current || valueIdx > current.idx)
				scopeMaxIdx[scopeKey] = {value, idx: valueIdx};
		}

		return _keys(scopeMaxIdx).map(k => `${k}:${scopeMaxIdx[k].value}`);
	}

	__performProjectSetup() {
		return {
			priority: 100,
			processor: async () => {
				await this.createDefaultGroupFromScopeContributions();
				await this.ensurePermissionsAdminGroup();
			}
		};
	}

	private async createDefaultGroupFromScopeContributions() {
		const contributions = flatArray(dispatcher_collectDefaultScopeValues.dispatchModule());
		this.logInfoBold(`Collected ${contributions.length} default scope contributions`);

		const scopeEntries = filterDuplicates(contributions.map(grant => `${grant.scope.key}:${grant.value}`));

		const _auditorId = MemKey_AccountId.get();
		await ModuleBE_PermissionGroupDB.set.all([{
			_id: GroupId_Default,
			label: 'Default',
			uiLabel: 'Default',
			scopeEntries,
			_auditorId,
		}]);

		this.logInfoBold(`Default group upserted with ${scopeEntries.length} scope entries`);
	}

	private async ensurePermissionsAdminGroup() {
		const existing = await ModuleBE_PermissionGroupDB.query.unique(GroupId_PermissionsAdmin);
		if (existing)
			return;

		const allScopes = await this.getRegisteredScopes();
		const adminEntries = allScopes.map(s => `${s.key}:${s.values[s.values.length - 1]}`);
		adminEntries.push(...PermissionGroup_SuperAdmin_ScopeEntries);

		const _auditorId = MemKey_AccountId.get();
		await ModuleBE_PermissionGroupDB.set.all([{
			_id: GroupId_PermissionsAdmin,
			label: 'Permissions Admin',
			uiLabel: 'Permissions Admin',
			scopeEntries: filterDuplicates(adminEntries),
			_auditorId,
		}]);

		this.logInfoBold('Permissions Admin group created');
	}
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();
