/*
 * @nu-art/sync-manager-backend — Request-scoped write set for sync routes
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {asArray, type DB_Object} from '@nu-art/ts-common';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {SyncDelta} from '@nu-art/sync-manager-shared';

type Bucket = {
	toUpdate: Map<string, DB_Object>;
	toDelete: Map<string, DB_Object>;
};

export type WrittenSyncState = {
	byDbKey: Map<string, Bucket>;
};

export const MemKey_WrittenSync = new MemKey<WrittenSyncState>('sync-manager--written-sync');

export const emptyWrittenSync = (): WrittenSyncState => ({byDbKey: new Map()});

const bucketFor = (state: WrittenSyncState, dbKey: string): Bucket => {
	let bucket = state.byDbKey.get(dbKey);
	if (!bucket) {
		bucket = {toUpdate: new Map(), toDelete: new Map()};
		state.byDbKey.set(dbKey, bucket);
	}
	return bucket;
};

/**
 * Mutates the request-level object in place.
 * A transaction opens a child MemStorage, and MemKey.set writes only on that child.
 */
export const recordWrittenSync = (dbKey: string, data: PostWriteProcessingDataShape<DB_Object>): void => {
	const state = MemKey_WrittenSync.peak();
	if (!state)
		return;

	const bucket = bucketFor(state, dbKey);
	if (data.updated) {
		for (const item of asArray(data.updated)) {
			bucket.toDelete.delete(item._id);
			bucket.toUpdate.set(item._id, item);
		}
	}
	if (!data.deleted)
		return;

	for (const item of asArray(data.deleted)) {
		bucket.toUpdate.delete(item._id);
		bucket.toDelete.set(item._id, item);
	}
};

export const readWrittenSync = (): SyncDelta => {
	const state = MemKey_WrittenSync.get();
	const delta: SyncDelta = [];
	for (const [dbKey, bucket] of state.byDbKey) {
		if (bucket.toUpdate.size === 0 && bucket.toDelete.size === 0)
			continue;
		delta.push({
			dbKey,
			toUpdate: [...bucket.toUpdate.values()],
			toDelete: [...bucket.toDelete.values()],
		});
	}
	return delta;
};
