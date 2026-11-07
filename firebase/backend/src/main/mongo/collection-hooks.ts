/*
 * @nu-art/firebase-backend - Mongo collection hooks and id composition
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Prototype} from '@nu-art/db-api-shared';
import {composeDbObjectUniqueId, FirestoreQuery} from '@nu-art/firebase-shared';
import {
	compare,
	Const_UniqueKeys,
	dbIdLength,
	exists,
	generateHex,
	MUSTNeverHappenException,
	TS_Object,
} from '@nu-art/ts-common';

export type PostWriteProcessingData<DBType extends TS_Object> = {
	before?: DBType | DBType[];
	updated?: DBType | DBType[];
	deleted?: DBType | DBType[] | null;
};

export type CollectionActionType = 'create' | 'set' | 'update' | 'delete';

export type CollectionHooks<DBType extends TS_Object> = {
	canDeleteItems: (dbItems: DBType[]) => Promise<void>,
	preWriteProcessing?: (dbInstance: DBType, originalDbInstance?: DBType) => Promise<void>,
	manipulateQuery?: (query: FirestoreQuery<DBType>) => FirestoreQuery<DBType>,
	postWriteProcessing?: (data: PostWriteProcessingData<DBType>, actionType: CollectionActionType) => Promise<void>,
	upgradeInstances: (instances: DBType[]) => Promise<any>
};

/**
 * If the collection has unique keys, assert they exist, and use them to generate the _id.
 * In the case an _id already exists, verify it is not different from the uniqueKeys-generated _id.
 */
export const assertUniqueId = <Proto extends DB_Prototype>(item: Proto['dbType'], keys: Proto['uniqueKeys']): Proto['dbType']['_id'] => {
	if (compare(keys, Const_UniqueKeys as Proto['uniqueKeys']))
		return (item._id ?? generateHex(dbIdLength)) as Proto['dbType']['_id'];

	const _id = composeDbObjectUniqueId(item, keys) as Proto['dbType']['_id'];
	if (exists(item._id) && _id !== item._id)
		throw new MUSTNeverHappenException(`When checking the existing _id, it did not match the _id composed from the unique keys! \n expected: ${_id} \n actual: ${item._id}`);

	return _id;
};
