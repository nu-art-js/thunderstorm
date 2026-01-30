/*
 * @nu-art/db-api-backend - Minimal stubs for ModuleBE_BaseDB (no thunderstorm dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Const_UniqueKeys, Day, DBDef_V3, DB_Object, DBProto, Hour} from '@nu-art/ts-common';
import type {ResponseError} from '@nu-art/ts-common/core/exceptions/types';
import {Dispatcher} from '@nu-art/ts-common';
import type {Transaction} from 'firebase-admin/firestore';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {UniqueId} from '@nu-art/ts-common';

export type DBApiBEConfig<Proto extends DBProto<any>> = {
	uniqueKeys: Proto['uniqueKeys'];
	itemName: string;
	versions: Proto['versions'];
	TTL: number;
	lastUpdatedTTL: number;
	lockKeys?: Proto['lockKeys'];
};

export const getModuleBEConfig = <Proto extends DBProto<any, any, any>>(dbDef: DBDef_V3<Proto>): DBApiBEConfig<Proto> => {
	return {
		versions: dbDef.versions,
		lockKeys: dbDef.lockKeys,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Proto['uniqueKeys'],
		itemName: dbDef.entityName,
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day,
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
	__collectEntityDependencies: <T extends DBProto<any>>(type: T['dbKey'], itemIds: string[], transaction?: Transaction) => Promise<DBEntityDependencies | undefined>;
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
