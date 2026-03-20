/*
 * @nu-art/sync-manager-shared - Sync manager types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, TypedMap} from '@nu-art/ts-common';

/** Payload for sync-manager backend onPostWrite (same shape as post-write data from collection hooks). */
export type SyncPostWriteData = {
	updated?: DB_Object | DB_Object[];
	deleted?: DB_Object | DB_Object[] | null;
};

/** Options for onPostWrite (collection uniqueKeys and optional transaction). */
export type SyncPostWriteOptions = {
	uniqueKeys?: string[];
	transaction?: unknown;
};

/**
 * Contract for collections the sync-manager can drive delta/full sync against.
 * Backend fills this by adapting each registered BaseDB module's public `query` / `dbDef` surface; db-api does not implement or import this type.
 */
export interface SyncableCollectionBE {
	readonly dbKey: string;

	/** Items with __updated >= since. */
	queryUpdatedSince(since: number): Promise<DB_Object[]>;

	/** Used to bootstrap lastUpdated for a new module (e.g. max __updated). */
	getNewestTimestamp(): Promise<number>;
}

export type LastUpdated = { lastUpdated: number; oldestDeleted?: number };
export type SyncDataFirebaseState = TypedMap<LastUpdated>;
export type Response_DBSync<DBType extends DB_Object> = { toUpdate: DBType[]; toDelete: DB_Object[] };
export type SyncDbData = {
	dbKey: string;
	lastUpdated: number;
};

export const SmartSync_UpToDateSync = 'up-to-date' as const;
export const SmartSync_DeltaSync = 'delta-sync' as const;
export const SmartSync_FullSync = 'full' as const;

export type NoNeedToSyncModule = SyncDbData & {
	sync: typeof SmartSync_UpToDateSync;
};

export type DeltaSyncModule = SyncDbData & {
	sync: typeof SmartSync_DeltaSync;
	items: Response_DBSync<any>;
};

export type FullSyncModule = SyncDbData & {
	sync: typeof SmartSync_FullSync;
};

/** How a frontend DB module syncs (used by AwaitModules and sync-manager). */
export enum ModuleSyncType {
	NoSync,
	CSVSync,
	APISync
}
