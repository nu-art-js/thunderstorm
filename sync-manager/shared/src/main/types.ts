/*
 * @nu-art/sync-manager-shared - Sync manager types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDef, GeneralApi, TypedApi} from '@nu-art/api-types';
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

/** Documents one request wrote, grouped by collection. This is the HTTP body of a sync route. */
export type SyncDelta = {
	dbKey: string;
	toUpdate: DB_Object[];
	toDelete: DB_Object[];
}[];

export type SyncApiDef<API extends GeneralApi> = ApiDef<API> & { readonly syncDelta: true };

export type WithSyncResponse<API extends GeneralApi> = TypedApi<API['Method'], SyncDelta, API['Body'], API['Params'], API['Error']>;

export const syncApiDef = <API extends GeneralApi>(def: ApiDef<API>): SyncApiDef<WithSyncResponse<API>> =>
	({...def, syncDelta: true});

export const isSyncApiDef = (def: ApiDef<GeneralApi>): def is SyncApiDef<GeneralApi> =>
	(def as {syncDelta?: true}).syncDelta === true;
