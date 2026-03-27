import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {
	DB_PermissionUser,
	DBDef_PermissionUser,
	DatabaseDef_PermissionUser,
	GroupId_Default,
	GroupId_PermissionsAdmin,
	Request_AssignPermissions,
	User_Group,
	toPermissionGroupId,
	type PerformProjectSetup,
	type ResolveAdditionalPermissionGroups,
} from '@nu-art/permissions-shared';
import {ModuleBE_Permissions} from '../../modules/ModuleBE_Permissions.js';
import {
	ApiException,
	batchAction,
	batchActionParallel,
	DB_BaseObject,
	dbObjectToId,
	Dispatcher,
	exists,
	filterDuplicates,
	filterInstances,
	flatArray,
	JwtTools,
	UniqueId,
} from '@nu-art/ts-common';
import {ModuleBE_PermissionGroupDB} from '../permission-group/ModuleBE_PermissionGroupDB.js';
import {MemKey_AccountId, ModuleBE_AccountDB, ModuleBE_SessionDB, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account-backend';
import {Transaction} from 'firebase-admin/firestore';
import {UI_Account} from '@nu-art/user-account-shared';
import {MemKey_UserScopePermissions} from '../../consts.js';
import {CollectionActionType} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {getScopeValues} from '../../core/function-permission-registry.js';


const dispatcher_resolveAdditionalGroups = new Dispatcher<ResolveAdditionalPermissionGroups, '__resolveAdditionalPermissionGroups'>('__resolveAdditionalPermissionGroups');

export class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionUser>
	implements OnNewUserRegistered, OnUserLogin, PerformProjectSetup {

	constructor() {
		super(DBDef_PermissionUser);
	}

	__performProjectSetup() {
		return {
			priority: 200,
			processor: async () => {
				const accounts = await ModuleBE_AccountDB.query.where({});
				const permissionUserIds = accounts.map(dbObjectToId) as DatabaseDef_PermissionUser['id'][];
				const permissionsUser = await this.query.all(permissionUserIds);

				const usersToUpsert: DB_PermissionUser[] = [];
				const usersToDelete: DB_PermissionUser[] = [];
				permissionsUser.forEach((user, index) => {
					if (exists(user)) {
						if (!exists(accounts.find(account => (account._id as unknown as DatabaseDef_PermissionUser['id']) === user._id)))
							usersToDelete.push(user);
						return;
					}

					usersToUpsert.push({
						_id: accounts[index]._id as unknown as DatabaseDef_PermissionUser['id'],
						groups: [] as User_Group[],
					} as DB_PermissionUser);
				});

				await this.set.all(usersToUpsert);
				await this.delete.all(usersToDelete);
			}
		};
	}

	async __onUserLogin(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
		await this.ensureDefaultGroup(account as UI_Account & DB_BaseObject, transaction);
		await this.checkAdminGrantFlag(account as UI_Account & DB_BaseObject, transaction);
		await this.resolveAdditionalGroups(account as UI_Account & DB_BaseObject, 'login', transaction);
	}

	async __onNewUserRegistered(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
		await this.resolveAdditionalGroups(account as UI_Account & DB_BaseObject, 'register', transaction);
	}

	private async ensureDefaultGroup(uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) {
		const permissionUserId = uiAccount._id as unknown as DatabaseDef_PermissionUser['id'];
		const permissionUser = await this.query.unique(permissionUserId, transaction);
		if (!permissionUser)
			return;

		const hasDefaultGroup = permissionUser.groups.some(g => g.groupId === GroupId_Default);
		if (hasDefaultGroup)
			return;

		permissionUser.groups.push({groupId: GroupId_Default});
		await this.set.item(permissionUser, transaction);
		this.logInfo(`Backfilled Default group for user ${permissionUserId}`);
	}

	private async checkAdminGrantFlag(uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) {
		const flagRef = ModuleBE_Permissions.getAdminGrantFlagRef();
		const flagValue = await flagRef.get(false);
		if (!flagValue)
			return;

		const permissionUserId = uiAccount._id as unknown as DatabaseDef_PermissionUser['id'];
		const permissionUser = await this.query.unique(permissionUserId, transaction);
		if (!permissionUser)
			return;

		const hasAdminGroup = permissionUser.groups.some(g => g.groupId === GroupId_PermissionsAdmin);
		if (hasAdminGroup) {
			await flagRef.set(false);
			return;
		}

		permissionUser.groups.push({groupId: GroupId_PermissionsAdmin});
		await this.set.item(permissionUser, transaction);
		await flagRef.set(false);
		this.logInfo(`Granted Permissions Admin to user ${permissionUserId} via RTDB flag (one-shot)`);
	}

	private async resolveAdditionalGroups(uiAccount: UI_Account & DB_BaseObject, context: 'register' | 'login', transaction: Transaction) {
		const results: string[][] = await dispatcher_resolveAdditionalGroups.dispatchModuleAsync(uiAccount._id, context);
		const additionalGroupIds = filterDuplicates(flatArray(results));
		if (additionalGroupIds.length === 0)
			return;

		const permissionUserId = uiAccount._id as unknown as DatabaseDef_PermissionUser['id'];
		const permissionUser = await this.query.unique(permissionUserId, transaction);
		if (!permissionUser)
			return;

		const existingGroupIds = new Set(permissionUser.groups.map(g => g.groupId as string));
		const newGroupIds = additionalGroupIds.filter((id: string) => !existingGroupIds.has(id));
		if (newGroupIds.length === 0)
			return;

		const validGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(newGroupIds.map((id: string) => toPermissionGroupId(id))));
		validGroups.forEach(g => permissionUser.groups.push({groupId: g._id}));
		await this.set.item(permissionUser, transaction);
		this.logInfo(`Added ${validGroups.length} additional groups on ${context} for user ${permissionUserId}`);
	}

	protected async preWriteProcessing(instance: DB_PermissionUser, originalDbInstance: DatabaseDef_PermissionUser['dbType'], t?: Transaction): Promise<void> {
		instance._auditorId = MemKey_AccountId.get();
		instance.__groupIds = filterDuplicates(instance.groups.map(group => group.groupId) || []);

		if (!instance.__groupIds.length)
			return;

		const dbGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(instance.__groupIds, t));
		if (instance.__groupIds.length !== dbGroups.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(422, `Trying to assign a user to a permission-group that does not exist: ${instance.__groupIds.filter(groupId => !dbGroupIds.includes(groupId))}`);
		}
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_PermissionUser['dbType']>, actionType: CollectionActionType) {
		const deleted = data.deleted ? (Array.isArray(data.deleted) ? data.deleted : [data.deleted]) : [];
		const updated = data.updated ? (Array.isArray(data.updated) ? data.updated : [data.updated]) : [];
		const before = data.before ? (Array.isArray(data.before) ? data.before : [data.before]) : [];
		const beforeIds = before.map(b => b._id);
		const accountIdToInvalidate = filterDuplicates(filterInstances([...deleted, ...updated].map(i => i._id))).filter(id => beforeIds.includes(id));
		await this.rotateSession(accountIdToInvalidate);
	}

	insertIfNotExist = async (uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) => {
		const create = async (transaction?: Transaction) => {
			const groups: User_Group[] = [{groupId: GroupId_Default}];

			const existingUsers = await this.query.custom({limit: 1}, transaction);
			if (existingUsers.length === 0) {
				groups.push({groupId: GroupId_PermissionsAdmin});
				this.logInfo('First-ever user — assigning Permissions Admin group');
			}

			const validGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(groups.map(g => g.groupId)));
			this.logInfo(`Assigning ${validGroups.length} groups to new user (of ${groups.length} requested)`);

			const permissionUserId = uiAccount._id as unknown as DatabaseDef_PermissionUser['id'];
			return ModuleBE_PermissionUserDB.create.item({
				_id: permissionUserId,
				groups: validGroups.map(group => ({groupId: group._id})),
				_auditorId: MemKey_AccountId.get()
			}, transaction);
		};

		return ModuleBE_PermissionUserDB.collection.uniqueGetOrCreate({_id: uiAccount._id as unknown as DatabaseDef_PermissionUser['id']}, create, transaction);
	};

	async assignPermissions(body: Request_AssignPermissions) {
		if (!body.targetAccountIds.length)
			throw new ApiException(400, `Asked to modify permissions but provided no users to modify permissions of.`);

		const permissionUserIds = body.targetAccountIds as unknown as DatabaseDef_PermissionUser['id'][];
		const usersToGiveTo = filterInstances(await this.query.all(permissionUserIds));
		if (!usersToGiveTo.length || usersToGiveTo.length !== body.targetAccountIds.length) {
			const dbUserIds = usersToGiveTo.map(dbObjectToId);
			throw new ApiException(404, `Asked to give permissions to non-existent user accounts: ${body.targetAccountIds.filter(id => !dbUserIds.includes(id))}`);
		}

		const dbGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(body.permissionGroupIds));
		if (dbGroups.length !== body.permissionGroupIds.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(404, `Asked to give users non-existing permission groups: ${body.permissionGroupIds.filter(id => !dbGroupIds.includes(id))}`);
		}

		const myScopes = MemKey_UserScopePermissions.get();
		const groupScopeEntries = filterDuplicates(dbGroups.flatMap(g => g.scopeEntries ?? []));
		for (const entry of groupScopeEntries) {
			const colonIdx = entry.indexOf(':');
			if (colonIdx === -1)
				continue;

			const scopeKey = entry.substring(0, colonIdx);
			const requiredValue = entry.substring(colonIdx + 1);
			const scopeValues = getScopeValues(scopeKey);
			if (!scopeValues)
				continue;

			const requiredIdx = scopeValues.indexOf(requiredValue);
			const myEntry = myScopes.find(p => p.startsWith(scopeKey + ':'));
			const myValue = myEntry ? myEntry.substring(scopeKey.length + 1) : undefined;
			const myIdx = myValue ? scopeValues.indexOf(myValue) : -1;

			if (myIdx < requiredIdx)
				throw new ApiException(403, `Cannot assign scope '${scopeKey}:${requiredValue}' — your access is insufficient`);
		}

		const groupIds = dbGroups.map(group => ({groupId: group._id}));
		const usersToUpdate = usersToGiveTo.map(user => {
			user.groups = groupIds;
			return user;
		});

		await this.set.multi(usersToUpdate);
	}

	public async rotateSession(accountIds: UniqueId[]) {
		if (!accountIds.length)
			return;

		const sessions = await batchActionParallel(accountIds, 10, async ids => await ModuleBE_SessionDB.query.custom({where: {accountId: {$in: ids as any}}}));
		const validSessions = filterInstances(await Promise.all(sessions.map(async session => {
			const isExpired = await JwtTools.isJwtExpired(session.sessionIdJwt);
			return isExpired ? undefined : session;
		})));
		this.logWarning(`#### Rotating ${validSessions.length} Sessions! ####`);
		await batchAction(validSessions, 500, async sessions => {
			await this.runTransaction(async t => {
				await Promise.all(sessions.map(session => ModuleBE_SessionDB._session.rotate.reissue.bySession(session, t)));
			});
		});
	}
}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();
