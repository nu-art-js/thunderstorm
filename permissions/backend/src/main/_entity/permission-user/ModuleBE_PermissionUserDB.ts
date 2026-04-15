import {ModuleBE_BaseDB, PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {
	DatabaseDef_PermissionRole,
	DatabaseDef_PermissionUser,
	DB_PermissionUser,
	DBDef_PermissionUser,
	Request_AssignPermissions,
	RoleAssignment,
} from '@nu-art/permissions-shared';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {asSetupTaskKey, type PerformProjectSetup, type SetupTask} from '@nu-art/action-processor-backend';
import {ModuleBE_Permissions, RoleId_AppDefault, RoleId_PermissionsAdmin, ServiceAccountId_Bootstrap, SetupTaskKey_PermissionsRoles} from '../../modules/ModuleBE_Permissions.js';
import {
	ApiException,
	asArray,
	dbObjectToId,
	Dispatcher,
	filterDuplicates,
	filterInstances,
	flatArray,
} from '@nu-art/ts-common';
import {ModuleBE_PermissionRoleDB} from '../permission-role/ModuleBE_PermissionRoleDB.js';
import {ModuleBE_PermissionScopeDB} from '../permission-scope/ModuleBE_PermissionScopeDB.js';
import {ModuleBE_AccountDB, OnAccountDeleted, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account-backend';
import {SafeDB_Account} from '@nu-art/user-account-shared';
import {MemKey_UserScopePermissions} from '../../consts.js';
import {CollectionActionType} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {getScopeValues} from '../../core/function-permission-registry.js';


export interface ResolveAdditionalPermissionRoles {
	__resolveAdditionalPermissionRoles(accountId: string, context: 'register' | 'login'): Promise<string[]>;
}

const dispatcher_resolveAdditionalRoles = new Dispatcher<ResolveAdditionalPermissionRoles, '__resolveAdditionalPermissionRoles'>('__resolveAdditionalPermissionRoles');

export const SetupTaskKey_PermissionsUsers = asSetupTaskKey('permissions-users');

export class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PermissionUser>
	implements OnNewUserRegistered, OnUserLogin, PerformProjectSetup, OnAccountDeleted {

	__onAccountDeleted = async (account: SafeDB_Account) => {
		await this.delete.unique(this.toPermissionUserId(account));
	};

	constructor() {
		super(DBDef_PermissionUser);
	}

	__performProjectSetup(): SetupTask[] {
		return [{
			key: SetupTaskKey_PermissionsUsers,
			dependsOn: [SetupTaskKey_PermissionsRoles],
			processor: () => ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
				const accounts = await ModuleBE_AccountDB.query.where({});
				this.logDebug(`Found ${accounts.length} accounts for permission-user sync`);

				const permissionUserIds = accounts.map(a => stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(a._id));
				const permissionsUser = await this.query.all(permissionUserIds);

				const usersToUpsert: DB_PermissionUser[] = [];
				const usersToDelete: DB_PermissionUser[] = [];
				permissionsUser.forEach((user, index) => {
					if (user) {
						const accountExists = accounts.some(account => stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(account._id) === user._id);
						if (!accountExists)
							usersToDelete.push(user);

						return;
					}

					usersToUpsert.push({
						_id: stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(accounts[index]._id),
						roles: [] as RoleAssignment[],
					} as DB_PermissionUser);
				});

				this.logDebug(`Permission users to upsert: ${usersToUpsert.length}, to delete: ${usersToDelete.length}`);
				usersToUpsert.forEach(u => this.logDebug(`  upsert _id=${u._id}  roles=${u.roles.length}`));
				usersToDelete.forEach(u => this.logDebug(`  delete _id=${u._id}`));

				await this.set.all(usersToUpsert);
				await this.delete.all(usersToDelete);
			})
		}];
	}

	async __onUserLogin(account: SafeDB_Account) {
		await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			const isNew = await this.insertIfNotExist(account);
			if (!isNew) {
				await this.ensureDefaultRole(account);
				await this.ensurePersonalRole(account);
				await this.checkAdminGrantFlag(account);
			}
			await this.resolveAdditionalRoles(account, 'login');
			await ModuleBE_Permissions.recomputePermissionsForUsers([account._id]);
		});
	}

	async __onNewUserRegistered(account: SafeDB_Account) {
		await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			await this.insertIfNotExist(account);
			await this.resolveAdditionalRoles(account, 'register');
			await ModuleBE_Permissions.recomputePermissionsForUsers([account._id]);
		});
	}

	private toPermissionUserId(account: SafeDB_Account): DatabaseDef_PermissionUser['id'] {
		return stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(account._id);
	}

	private toPersonalRoleId(account: SafeDB_Account): DatabaseDef_PermissionRole['id'] {
		return stringToUniqueId<DatabaseDef_PermissionRole['dbKey']>(account._id);
	}

	private async ensureDefaultRole(account: SafeDB_Account) {
		const permissionUser = await this.query.unique(this.toPermissionUserId(account));
		if (!permissionUser)
			return;

		if (permissionUser.roles.some(r => r.roleId === RoleId_AppDefault))
			return;

		permissionUser.roles.push({roleId: RoleId_AppDefault});
		await this.set.item(permissionUser);
		this.logInfo(`Backfilled Default role for user ${account._id}`);
	}

	private async ensurePersonalRole(account: SafeDB_Account) {
		const personalRoleId = this.toPersonalRoleId(account);
		const existing = await ModuleBE_PermissionRoleDB.query.unique(personalRoleId);
		if (!existing) {
			await ModuleBE_PermissionRoleDB.create.item({
				_id: personalRoleId,
				label: `Personal (${account.email ?? account._id})`,
				type: 'personal',
				scopeEntries: [],
			});
			this.logInfo(`Created personal role for user ${account._id}`);
		}

		const permissionUser = await this.query.unique(this.toPermissionUserId(account));
		if (!permissionUser)
			return;

		if (permissionUser.roles.some(r => r.roleId === personalRoleId))
			return;

		permissionUser.roles.push({roleId: personalRoleId});
		await this.set.item(permissionUser);
		this.logInfo(`Assigned personal role to user ${account._id}`);
	}

	private async checkAdminGrantFlag(account: SafeDB_Account) {
		const flagRef = ModuleBE_Permissions.getAdminGrantFlagRef();
		const flagValue = await flagRef.get(false);
		if (!flagValue)
			return;

		const permissionUser = await this.query.unique(this.toPermissionUserId(account));
		if (!permissionUser)
			return;

		if (permissionUser.roles.some(r => r.roleId === RoleId_PermissionsAdmin)) {
			await flagRef.set(false);
			return;
		}

		permissionUser.roles.push({roleId: RoleId_PermissionsAdmin});
		await this.set.item(permissionUser);
		await flagRef.set(false);
		this.logInfo(`Granted Permissions Admin to user ${account._id} via RTDB flag (one-shot)`);
	}

	private async resolveAdditionalRoles(account: SafeDB_Account, context: 'register' | 'login') {
		const results: string[][] = await dispatcher_resolveAdditionalRoles.dispatchModuleAsync(account._id, context);
		const additionalRoleIds = filterDuplicates(flatArray(results));
		if (additionalRoleIds.length === 0)
			return;

		const permissionUser = await this.query.unique(this.toPermissionUserId(account));
		if (!permissionUser)
			return;

		const existingRoleIds = new Set(permissionUser.roles.map(r => r.roleId as string));
		const newRoleIds = additionalRoleIds.filter(id => !existingRoleIds.has(id));
		if (newRoleIds.length === 0)
			return;

		const validRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(newRoleIds.map(id => stringToUniqueId<DatabaseDef_PermissionRole['dbKey']>(id))));
		validRoles.forEach(r => permissionUser.roles.push({roleId: r._id}));
		await this.set.item(permissionUser);
		this.logInfo(`Added ${validRoles.length} additional roles on ${context} for user ${account._id}`);
	}

	protected async preWriteProcessing(instance: DB_PermissionUser, originalDbInstance: DatabaseDef_PermissionUser['dbType']): Promise<void> {
		instance.__roleIds = filterDuplicates(instance.roles.map(role => role.roleId) || []);

		if (!instance.__roleIds.length)
			return;

		const dbRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(instance.__roleIds));
		if (instance.__roleIds.length !== dbRoles.length) {
			const dbRoleIds = dbRoles.map(dbObjectToId);
			throw new ApiException(422, `Trying to assign a user to a permission role that does not exist: ${instance.__roleIds.filter(roleId => !dbRoleIds.includes(roleId))}`);
		}
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_PermissionUser['dbType']>, actionType: CollectionActionType) {
		const deleted = asArray(data.deleted ?? []);
		const updated = asArray(data.updated ?? []);
		const before = filterInstances(asArray(data.before ?? []));
		const beforeIds = before.map(b => b._id);
		const accountIdsToRecompute = filterDuplicates(filterInstances([...deleted, ...updated].map(i => i._id))).filter(id => beforeIds.includes(id));
		await ModuleBE_Permissions.recomputePermissionsForUsers(accountIdsToRecompute);
	}

	insertIfNotExist = async (account: SafeDB_Account): Promise<boolean> => {
		const permissionUserId = this.toPermissionUserId(account);
		let created = false;

		const create = async () => {
			created = true;
			const personalRoleId = this.toPersonalRoleId(account);
			await ModuleBE_PermissionRoleDB.create.item({
				_id: personalRoleId,
				label: `Personal (${account.email ?? account._id})`,
				type: 'personal',
				scopeEntries: [],
			});

			const roles: RoleAssignment[] = [{roleId: RoleId_AppDefault}, {roleId: personalRoleId}];

			const existingUsers = await this.query.custom({limit: 1});
			if (existingUsers.length === 0) {
				roles.push({roleId: RoleId_PermissionsAdmin});
				this.logInfo('First-ever user — assigning Permissions Admin role');
			}

			const validRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(roles.map(r => r.roleId)));
			this.logInfo(`Assigning ${validRoles.length} roles to new user (of ${roles.length} requested)`);

			return ModuleBE_PermissionUserDB.create.item({
				_id: permissionUserId,
				roles: validRoles.map(role => ({roleId: role._id})),
			});
		};

		await ModuleBE_PermissionUserDB.collection.uniqueGetOrCreate({_id: permissionUserId}, create);
		return created;
	};

	async assignPermissions(body: Request_AssignPermissions) {
		if (!body.targetAccountIds.length)
			throw new ApiException(400, `Asked to modify permissions but provided no users to modify permissions of.`);

		const permissionUserIds = body.targetAccountIds.map(id => stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(id));
		const usersToGiveTo = filterInstances(await this.query.all(permissionUserIds));
		if (!usersToGiveTo.length || usersToGiveTo.length !== body.targetAccountIds.length) {
			const dbUserIds = usersToGiveTo.map(dbObjectToId);
			throw new ApiException(404, `Asked to give permissions to non-existent user accounts: ${body.targetAccountIds.filter(id => !dbUserIds.includes(stringToUniqueId<DatabaseDef_PermissionUser['dbKey']>(id)))}`);
		}

		const dbRoles = filterInstances(await ModuleBE_PermissionRoleDB.query.all(body.permissionRoleIds));
		if (dbRoles.length !== body.permissionRoleIds.length) {
			const dbRoleIds = dbRoles.map(dbObjectToId);
			throw new ApiException(404, `Asked to give users non-existing permission roles: ${body.permissionRoleIds.filter(id => !dbRoleIds.includes(id))}`);
		}

		const myScopes = MemKey_UserScopePermissions.get();
		const roleScopeIds = filterDuplicates(dbRoles.flatMap(r => r.scopeEntries ?? []));
		const scopeEntities = filterInstances(await ModuleBE_PermissionScopeDB.query.all(roleScopeIds));
		for (const entity of scopeEntities) {
			const scopeValues = getScopeValues(entity.key);
			if (!scopeValues)
				continue;

			const requiredIdx = scopeValues.indexOf(entity.value);
			const myEntry = myScopes.find(p => p.startsWith(entity.key + ':'));
			const myValue = myEntry ? myEntry.substring(entity.key.length + 1) : undefined;
			const myIdx = myValue ? scopeValues.indexOf(myValue) : -1;

			if (myIdx < requiredIdx)
				throw new ApiException(403, `Cannot assign scope '${entity.key}:${entity.value}' — your access is insufficient`);
		}

		const roleIds = dbRoles.map(role => ({roleId: role._id}));
		const usersToUpdate = usersToGiveTo.map(user => {
			user.roles = roleIds;
			return user;
		});

		await this.set.multi(usersToUpdate);
	}

}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();
