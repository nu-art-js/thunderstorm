/*
 * @nu-art/sync-manager-shared - Sync manager types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, TypedMap} from '@nu-art/ts-common';

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
