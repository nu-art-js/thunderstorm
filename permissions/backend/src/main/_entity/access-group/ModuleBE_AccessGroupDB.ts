import {ApiException, Dispatcher, filterDuplicates, UniqueId} from '@nu-art/ts-common';
import {ModuleBE_BaseDB, PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import type {DatabaseDef_AccessGroup, DB_AccessGroup} from '@nu-art/permissions-shared';
import {DBDef_AccessGroup} from '@nu-art/permissions-shared';
import {CollectionActionType} from '@nu-art/firebase-backend/firestore/FirestoreCollection';


export interface OnAccessGroupMembershipChanged {
	__onAccessGroupMembershipChanged(changedGroupIds: UniqueId[]): Promise<void>;
}

const dispatcher_accessGroupMembershipChanged = new Dispatcher<OnAccessGroupMembershipChanged, '__onAccessGroupMembershipChanged'>('__onAccessGroupMembershipChanged');

export class ModuleBE_AccessGroupDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_AccessGroup> {

	constructor() {
		super(DBDef_AccessGroup);
	}

	protected async preWriteProcessing(instance: DB_AccessGroup, _original: DatabaseDef_AccessGroup['dbType']): Promise<void> {
		if (instance.type === 'personal' && instance.members.length > 0)
			throw new ApiException(400, 'Personal access groups cannot have members');
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_AccessGroup['dbType']>, _actionType: CollectionActionType) {
		const updated = Array.isArray(data.updated) ? data.updated : data.updated ? [data.updated] : [];
		const before = Array.isArray(data.before) ? data.before : data.before ? [data.before] : [];

		const changedGroupIds: UniqueId[] = [];
		for (let i = 0; i < updated.length; i++) {
			const prev = before[i];
			if (!prev || JSON.stringify([...updated[i].members].sort()) !== JSON.stringify([...prev.members].sort()))
				changedGroupIds.push(updated[i]._id);
		}

		if (changedGroupIds.length === 0)
			return;

		await dispatcher_accessGroupMembershipChanged.dispatchModuleAsync(filterDuplicates(changedGroupIds));
	}
}

export const ModuleBE_AccessGroupDB = new ModuleBE_AccessGroupDB_Class();
