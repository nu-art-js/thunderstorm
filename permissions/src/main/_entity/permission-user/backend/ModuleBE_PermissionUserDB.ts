import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {
	DB_PermissionUser,
	DBDef_PermissionUser,
	DBProto_PermissionUser,
	Request_AssignPermissions,
	User_Group
} from './shared';
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
	TypedMap
} from '@nu-art/ts-common';
import {PostWriteProcessingData} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {ModuleBE_PermissionGroupDB} from '../../permission-group/backend/ModuleBE_PermissionGroupDB';
import {
	MemKey_AccountId,
	ModuleBE_AccountDB,
	ModuleBE_SessionDB,
	OnNewUserRegistered,
	OnUserLogin
} from '@nu-art/user-account/backend';
import {Transaction} from 'firebase-admin/firestore';
import {UI_Account} from '@nu-art/user-account';
import {MemKey_UserPermissions} from '../../../backend/consts';


type Config = DBApiConfigV3<DBProto_PermissionUser> & {}

export class ModuleBE_PermissionUserDB_Class
	extends ModuleBE_BaseDB<DBProto_PermissionUser, Config>
	implements OnNewUserRegistered, OnUserLogin, PerformProjectSetup {

	private defaultPermissionGroups?: User_Group[];

	constructor() {
		super(DBDef_PermissionUser);
	}

	async __performProjectSetup() {
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

	protected async preWriteProcessing(instance: DB_PermissionUser, t?: Transaction): Promise<void> {
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

	protected async postWriteProcessing(data: PostWriteProcessingData<DB_PermissionUser>) {
		const deleted = asOptionalArray(data.deleted) ?? [];
		const updated = asOptionalArray(data.updated) ?? [];
		const beforeIds = (asOptionalArray(data.before) ?? []).map(before => before?._id);

		const accountIdToInvalidate = filterDuplicates(filterInstances([...deleted, ...updated].map(i => i?._id))).filter(id => beforeIds.includes(id));
		await ModuleBE_SessionDB.session.invalidate(accountIdToInvalidate);
	}

	async insertIfNotExist(uiAccount: UI_Account & DB_BaseObject, transaction: Transaction) {
		const create = async (transaction?: Transaction) => {
			const permissionGroups = this.defaultPermissionGroups ? filterInstances(await ModuleBE_PermissionGroupDB.query.all(this.defaultPermissionGroups.map(item => item.groupId))) : [];
			this.logInfo(`Received ${this.defaultPermissionGroups?.length} groups to assign, ${permissionGroups.length} of which exist`);
			const permissionsUserToCreate = {
				_id: uiAccount._id,
				groups: permissionGroups.map(group => ({groupId: group._id})),
				_auditorId: MemKey_AccountId.get()
			};

			return this.create.item(permissionsUserToCreate, transaction);
		};

		return this.collection.uniqueGetOrCreate({_id: uiAccount._id}, create, transaction);
	}

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

	public setDefaultPermissionGroups = (groups: User_Group[]) => {
		this.defaultPermissionGroups = groups;
	};

	public clearDefaultPermissionGroups = () => {
		delete this.defaultPermissionGroups;
	};
}

export const ModuleBE_PermissionUserDB = new ModuleBE_PermissionUserDB_Class();
