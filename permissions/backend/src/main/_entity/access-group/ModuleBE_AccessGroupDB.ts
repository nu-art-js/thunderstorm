import {currentTimeMillis, Dispatcher, filterDuplicates, UniqueId} from '@nu-art/ts-common';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import {HttpCodes} from '@nu-art/api-types';
import {ModuleBE_BaseDB, PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import type {DatabaseDef_AccessGroup, DB_AccessGroup} from '@nu-art/permissions-shared';
import {DBDef_AccessGroup} from '@nu-art/permissions-shared';
import {CollectionActionType} from '@nu-art/firebase-backend/firestore/FirestoreCollection';


export interface OnAccessGroupChanged {
	__onAccessGroupChanged(changedGroupIds: UniqueId[]): Promise<void>;
}

const dispatcher_accessGroupChanged = new Dispatcher<OnAccessGroupChanged, '__onAccessGroupChanged'>('__onAccessGroupChanged');

export class ModuleBE_AccessGroupDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_AccessGroup> {

	constructor() {
		super(DBDef_AccessGroup);
	}

	/**
	 * Insert or merge many custom groups in one bulkWrite.
	 * Existing members stay. `members` are added. `excludeMembers` are removed.
	 */
	async mergeCustomGroups(groups: {
		_id: DatabaseDef_AccessGroup['id'];
		key: string;
		label: string;
		members: UniqueId[];
		excludeMembers?: UniqueId[];
	}[]): Promise<void> {
		if (!groups.length)
			return;

		const collection = this.asMongoCollection();
		const now = currentTimeMillis();
		const version = collection.getVersion();
		// Same insert stamp as the access-group resolver: permissions-admin can read the row.
		const permissionsAdmin = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/permissions-admin');
		await this.patch!.all(groups.map(group => ({
			_id: group._id,
			pipeline: [{
				$set: {
					type: {$ifNull: ['$type', 'custom']},
					key: {$ifNull: ['$key', group.key]},
					label: {$ifNull: ['$label', group.label]},
					scopeEntries: {$ifNull: ['$scopeEntries', []]},
					__created: {$ifNull: ['$__created', now]},
					__updated: now,
					_v: version,
					__access: {
						$ifNull: ['$__access', {
							readers: [permissionsAdmin, group._id],
							writers: [permissionsAdmin],
							creators: [],
							deleters: [],
							owners: [],
						}],
					},
					members: {
						$filter: {
							input: {
								$setUnion: [
									{$ifNull: ['$members', []]},
									group.members,
								],
							},
							as: 'member',
							cond: {$not: [{$in: ['$$member', group.excludeMembers ?? []]}]},
						},
					},
				},
			}],
		})));
	}

	protected async preWriteProcessing(instance: DB_AccessGroup, _original: DatabaseDef_AccessGroup['dbType']): Promise<void> {
		if ((instance.type === 'user' || instance.type === 'service-account') && instance.members.length > 0)
			throw HttpCodes._4XX.BAD_REQUEST(`${instance.type} access groups cannot have members`);
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_AccessGroup['dbType']>, _actionType: CollectionActionType) {
		const updated = Array.isArray(data.updated) ? data.updated : data.updated ? [data.updated] : [];
		const before = Array.isArray(data.before) ? data.before : data.before ? [data.before] : [];
		const deleted = Array.isArray(data.deleted) ? data.deleted : data.deleted ? [data.deleted] : [];

		const changedGroupIds: UniqueId[] = [];

		for (let i = 0; i < updated.length; i++) {
			const prev = before[i];
			if (!prev) {
				changedGroupIds.push(updated[i]._id);
				continue;
			}

			const membersChanged = JSON.stringify([...updated[i].members].sort()) !== JSON.stringify([...prev.members].sort());
			const scopesChanged = JSON.stringify([...(updated[i].scopeEntries ?? [])].sort()) !== JSON.stringify([...(prev.scopeEntries ?? [])].sort());

			if (membersChanged || scopesChanged)
				changedGroupIds.push(updated[i]._id);
		}

		for (const del of deleted)
			changedGroupIds.push(del._id);

		if (changedGroupIds.length === 0)
			return;

		await dispatcher_accessGroupChanged.dispatchModuleAsync(filterDuplicates(changedGroupIds));
	}
}

export const ModuleBE_AccessGroupDB = new ModuleBE_AccessGroupDB_Class();
