import {DBApiConfigV3, MemKey_ServerApi, ModuleBE_BaseDB, Storm,} from '@nu-art/thunderstorm/backend';
import {DB_PermissionUser, DBDef_PermissionUser, DBProto_PermissionUser, Request_AssignPermissions, User_Group} from './shared';
import {PerformProjectSetup} from '@nu-art/thunderstorm/backend/modules/action-processor/Action_SetupProject';
import {
	_keys,
	ApiException,
	asOptionalArray,
	DB_BaseObject,
	dbObjectToId,
	exists,
	filterDuplicates,
	filterInstances,
	filterKeys,
	flatArray,
	merge,
	TS_Object,
	TypedMap,
	Year
} from '@nu-art/ts-common';
import {ModuleBE_PermissionGroupDB} from '../../permission-group/backend/ModuleBE_PermissionGroupDB';
import {MemKey_AccountId, ModuleBE_AccountDB, ModuleBE_SessionDB, OnNewUserRegistered, OnUserLogin} from '@nu-art/user-account/backend';
import {Transaction} from 'firebase-admin/firestore';
import {UI_Account} from '@nu-art/user-account';
import {MemKey_UserPermissions} from '../../../backend/consts';
import {CollectionActionType, PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import {DefaultDef_ServiceAccount, dispatcher_collectServiceAccounts} from '@nu-art/thunderstorm/backend/modules/_tdb/service-accounts';


type Config = DBApiConfigV3<DBProto_PermissionUser> & {}

export class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionUser, Config>
	implements OnNewUserRegistered, OnUserLogin, PerformProjectSetup {

	private defaultPermissionGroups?: () => Promise<User_Group[]>;

	constructor() {
		super(DBDef_PermissionUser);
	}

	__performProjectSetup() {
		return {
			priority: 4,
			processor: async () => {
				const accounts = await ModuleBE_AccountDB.query.where({});
				const permissionsUser = await this.query.all(accounts.map(dbObjectToId));

				const usersToUpsert: DB_PermissionUser[] = [];
				const usersToDelete: DB_PermissionUser[] = [];
				permissionsUser.forEach((user, index) => {
					if (exists(user)) {
						if (!exists(accounts.find(account => account._id === user._id)))
							usersToDelete.push(user);
						return;
					}

					usersToUpsert.push({
						_id: accounts[index]._id,
						groups: [] as User_Group[],
					} as DB_PermissionUser);
				});

				await this.set.all(usersToUpsert);
				await this.delete.all(usersToDelete);

				// This stage updates the rtdb's config- which is why it's last. Changing the rtdb's config kills the server.
				const serviceAccounts = flatArray(dispatcher_collectServiceAccounts.dispatchModule());
				await this.createSystemServiceAccount(serviceAccounts);
			}
		};
	}

	async __onUserLogin(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
	}

	async __onNewUserRegistered(account: UI_Account, transaction: Transaction) {
		await this.insertIfNotExist(account as UI_Account & DB_BaseObject, transaction);
	}

	// protected async canDeleteDocument(transaction: FirestoreTransaction, dbInstances: DB_PermissionUser[]) {
	// 	const conflicts: DB_PermissionUser[] = [];
	// 	const accounts = await ModuleBE_AccountDB.query.custom(_EmptyQuery);
	//
	// 	for (const item of dbInstances) {
	// 		const account = accounts.find(acc => acc._id === item.accountId);
	// 		if (account)
	// 			conflicts.push(item);
	// 	}
	//
	// 	if (conflicts.length)
	// 		throw new ApiException<DB_EntityDependency<any>[]>(422, 'permission users are connected to accounts').setErrorBody({
	// 			type: 'has-dependencies',
	// 			body: conflicts.map(conflict => ({collectionKey: 'User', conflictingIds: [conflict._id]}))
	// 		});
	// }

	protected async preWriteProcessing(instance: DB_PermissionUser, originalDbInstance: DBProto_PermissionUser['dbType'], t?: Transaction): Promise<void> {
		instance._auditorId = MemKey_AccountId.get();
		instance.__groupIds = filterDuplicates(instance.groups.map(group => group.groupId) || []);

		if (!instance.__groupIds.length)
			return;

		// Get all groups the user has from the collection
		const dbGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(instance.__groupIds, t));
		// Verify all groups actually existing in the collection
		if (instance.__groupIds.length !== dbGroups.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(422, `Trying to assign a user to a permission-group that does not exist: ${instance.__groupIds.filter(groupId => !dbGroupIds.includes(groupId))}`);
		}

		//todo check for duplications in data
	}

	protected async postWriteProcessing(data: PostWriteProcessingData<DBProto_PermissionUser>, actionType: CollectionActionType) {
		const deleted = asOptionalArray(data.deleted) ?? [];
		const updated = asOptionalArray(data.updated) ?? [];
		const beforeIds = (asOptionalArray(data.before) ?? []).map(before => before?._id);

		const accountIdToInvalidate = filterDuplicates(filterInstances([...deleted, ...updated].map(i => i?._id))).filter(id => beforeIds.includes(id));
		await ModuleBE_SessionDB.session.invalidate(accountIdToInvalidate);
	}

	insertIfNotExist = async (uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) => {
		const create = async (transaction?: Transaction) => {
			const defaultPermissionGroups = ModuleBE_PermissionUserDB.defaultPermissionGroups ? await ModuleBE_PermissionUserDB.defaultPermissionGroups() : [];
			const permissionGroups = ModuleBE_PermissionUserDB.defaultPermissionGroups ? filterInstances(await ModuleBE_PermissionGroupDB.query.all(defaultPermissionGroups.map(item => item.groupId))) : [];
			this.logInfo(`Received ${defaultPermissionGroups.length} groups to assign, ${permissionGroups.length} of which exist`);
			const permissionsUserToCreate = {
				_id: uiAccount._id,
				groups: permissionGroups.map(group => ({groupId: group._id})),
				_auditorId: MemKey_AccountId.get()
			};

			return ModuleBE_PermissionUserDB.create.item(permissionsUserToCreate, transaction);
		};

		return ModuleBE_PermissionUserDB.collection.uniqueGetOrCreate({_id: uiAccount._id}, create, transaction);
	};

	async assignPermissions(body: Request_AssignPermissions) {
		if (!body.targetAccountIds.length)
			throw new ApiException(400, `Asked to modify permissions but provided no users to modify permissions of.`);

		const usersToGiveTo = filterInstances(await this.query.all(body.targetAccountIds));
		// console.log('assignPermissions target accounts ');
		// console.log(await this.query.custom(_EmptyQuery));
		if (!usersToGiveTo.length || usersToGiveTo.length !== body.targetAccountIds.length) {
			const dbUserIds = usersToGiveTo.map(dbObjectToId);
			throw new ApiException(404, `Asked to give permissions to non-existent user accounts: ${body.targetAccountIds.filter(id => !dbUserIds.includes(id))}`);
		}

		const dbGroups = filterInstances(await ModuleBE_PermissionGroupDB.query.all(body.permissionGroupIds));
		if (dbGroups.length !== body.permissionGroupIds.length) {
			const dbGroupIds = dbGroups.map(dbObjectToId);
			throw new ApiException(404, `Asked to give users non-existing permission groups: ${body.permissionGroupIds.filter(id => !dbGroupIds.includes(id))}`);
		}

		const myUserPermissions = MemKey_UserPermissions.get();

		const permissionsToGive = dbGroups.reduce<TypedMap<number>>((map, group) => {
			// Gather the highest permissions for each domain, from all groups
			(_keys(group._levelsMap || []) as string[]).forEach(domainId => {
				if (map[domainId] === undefined)
					map[domainId] = 0;

				if (map[domainId] < group._levelsMap![domainId])
					map[domainId] = group._levelsMap![domainId];

			});
			return map;
		}, {});

		const failedDomains = (_keys(permissionsToGive) as string[]).filter(domainId => {
			const tooLowPermission = myUserPermissions[domainId] < permissionsToGive[domainId];
			this.logError(`${myUserPermissions[domainId]} < ${permissionsToGive[domainId]} === ${tooLowPermission}`);
			const noPermissionInThisDomain = myUserPermissions[domainId] === undefined;
			return noPermissionInThisDomain || tooLowPermission;
		});

		if (failedDomains.length)
			throw new ApiException(403, `Attempted to give higher permissions than current user has: ${failedDomains}`);

		const groupIds = dbGroups.map(group => ({groupId: group._id}));
		const usersToUpdate = usersToGiveTo.map(user => {
			user.groups = groupIds;
			return user;
		});

		await this.set.multi(usersToUpdate);
	}

	public setDefaultPermissionGroups = (groupsGetter: () => Promise<User_Group[]>) => {
		this.defaultPermissionGroups = groupsGetter;
	};

	public clearDefaultPermissionGroups = () => {
		delete this.defaultPermissionGroups;
	};

	/**
	 * The system requires to perform action, which in other cases can also be done by a human.
	 * This requires system features to identify as a bot user, or "Service Account"
	 *
	 * @param serviceAccounts - List of Accounts to create
	 * @private
	 */
	private async createSystemServiceAccount(serviceAccounts: DefaultDef_ServiceAccount[]) {
		this.logInfoBold('Creating Service Accounts: ', serviceAccounts);

		// @ts-ignore
		const tokenCreator = ModuleBE_AccountDB.token.create;
		// @ts-ignore
		const invalidateAccount = ModuleBE_AccountDB.token.invalidateAll;

		const envConfigRef = Storm.getInstance().getGlobalEnvConfigRef();
		const updatedConfig: TS_Object = {};

		//Run over all service accounts
		for (const serviceAccount of serviceAccounts) {
			// Create account if it doesn't already exist
			const accountsToRequest = filterKeys({
				type: 'service',
				email: serviceAccount.email,
				description: serviceAccount.description
			});
			let account;
			//Get or create service account
			try {
				account = await ModuleBE_AccountDB.impl.querySafeAccount({email: serviceAccount.email});
			} catch (e) {
				this.logInfo('NOTICE: querySafeAccount failed, creating accounts');
				account = await ModuleBE_AccountDB.account.create(accountsToRequest);
			}

			// Assign permissions groups to service account
			const permissionsUser = await ModuleBE_PermissionUserDB.query.uniqueAssert({_id: account._id});
			permissionsUser.groups = serviceAccount.groupIds?.map(groupId => ({groupId})) || [];
			await ModuleBE_PermissionUserDB.set.item(permissionsUser);

			//Service accounts are only allowed to have one session... but this isn't the defined place to be a cop about it
			const sessions = await ModuleBE_AccountDB.account.getSessions(account);
			//If we have a valid session(not expired) we use its JWT instead of creating a new one
			const validSession = sessions.sessions.find(_session => !ModuleBE_SessionDB.session.isExpired(_session));
			this.logError(serviceAccount.ttl);
			const token = validSession?.sessionIdJwt ? {token: validSession?.sessionIdJwt} : await tokenCreator({
				accountId: account._id,
				ttl: serviceAccount.ttl ?? Year
			});

			updatedConfig[serviceAccount.moduleName] = {
				serviceAccount: filterKeys({
					token,
					description: serviceAccount.description,
					accountId: account._id,
					email: account.email
				})
			};
		}

		if (_keys(updatedConfig).length > 0)
			MemKey_ServerApi.get().addPostCallAction(async () => {
				const currentConfig = await envConfigRef.get({});
				await envConfigRef.set(merge(currentConfig, updatedConfig));
				this.logInfoBold('Created Service Accounts for', _keys(updatedConfig));
			});
	}
}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();
