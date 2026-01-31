/*
 * @nu-art/db-api-backend - Minimal stubs for ModuleBE_BaseDB (no thunderstorm dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Const_UniqueKeys, Day, DB_Object, Hour} from '@nu-art/ts-common';
import type {ResponseError} from '@nu-art/ts-common/core/exceptions/types';
import type {UniqueId} from '@nu-art/ts-common';
import {Dispatcher} from '@nu-art/ts-common';
import type {Transaction} from 'firebase-admin/firestore';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {BaseDBDefBE, DBApiBEConfigShape} from '@nu-art/db-api-shared';

export type {DBApiBEConfigShape as DBApiBEConfig};

export const getModuleBEConfig = (dbDef: BaseDBDefBE): DBApiBEConfigShape => {
	return {
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys ?? Const_UniqueKeys as readonly string[],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL ?? Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL ?? Day,
	};
};

export type DBEntityDependencyResult = { [dbKey: string]: UniqueId[] };

export type DBEntityDependencies = {
	dbKey: string;
	dependencyMap: {
		[entityId: UniqueId]: DBEntityDependencyResult;
	};
};

export const DBEntityDependencyErrorType = 'entity-has-dependencies';

export type DBEntityDependencyError = ResponseError<typeof DBEntityDependencyErrorType, DBEntityDependencies>;

export interface EntityDependencyCollection {
	__collectEntityDependencies: (type: string, itemIds: string[], transaction?: Transaction) => Promise<DBEntityDependencies | undefined>;
}

export const dispatch_CollectEntityDependencies = new Dispatcher<EntityDependencyCollection, '__collectEntityDependencies'>('__collectEntityDependencies');

export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[]; toDelete: DB_Object[] };

type DeletedDBItem = DB_Object & { __collectionName: string; __docId: UniqueId };

const ModuleBE_SyncManagerStub = {
	async queryDeleted(_collectionName: string, _query: FirestoreQuery<DB_Object>): Promise<DeletedDBItem[]> {
		return [];
	},
	async setLastUpdated(_collectionName: string, _lastUpdated: number): Promise<void> {},
	async onItemsDeleted(_collectionName: string, _items: DB_Object[], _uniqueKeys?: string[], _transaction?: Transaction): Promise<void> {},
	async setOldestDeleted(_collectionName: string, _oldestDeleted: number): Promise<void> {},
};

export const ModuleBE_SyncManager = ModuleBE_SyncManagerStub;
