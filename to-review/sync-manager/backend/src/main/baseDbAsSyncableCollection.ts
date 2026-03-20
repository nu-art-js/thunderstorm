/*
 * @nu-art/sync-manager-backend — Bridge BaseDB → SyncableCollectionBE (sync-manager only)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {FirestoreQuery} from '@nu-art/firebase-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {SyncableCollectionBE} from '@nu-art/sync-manager-shared';
import {RuntimeModules, type DB_Object} from '@nu-art/ts-common';

/**
 * Adapts {@link ModuleBE_BaseDB} to {@link SyncableCollectionBE} using only public `dbDef` and `query` APIs.
 * db-api stays free of sync concepts; sync-manager owns orchestration.
 */
export function syncableCollectionFromBaseDb(dbModule: ModuleBE_BaseDB<any>): SyncableCollectionBE {
	const queryApi = dbModule.query;

	return {
		get dbKey() {
			return dbModule.dbDef.dbKey;
		},

		queryUpdatedSince: async (since: number): Promise<DB_Object[]> => {
			return queryApi.where({__updated: {$gte: since}});
		},

		getNewestTimestamp: async (): Promise<number> => {
			const query: FirestoreQuery<DB_Object> = {
				limit: 1,
				orderBy: [{key: '__updated', order: 'desc'}],
			};
			const rows = await queryApi.unManipulatedQuery(query);
			const first = rows[0];

			return first?.__updated ?? 0;
		},
	};
}

/** All registered {@link ModuleBE_BaseDB} instances, adapted for smartSync (same discovery idea as legacy thunderstorm sync-manager). */
export function syncableCollectionsFromRuntimeBaseDbModules(): SyncableCollectionBE[] {
	const baseDbModules = RuntimeModules().all.filter((m): m is ModuleBE_BaseDB<any> =>
		m.isInstanceOf(ModuleBE_BaseDB));

	return baseDbModules.map(m => syncableCollectionFromBaseDb(m));
}
