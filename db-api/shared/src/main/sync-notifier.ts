/*
 * @nu-art/db-api-shared - Sync notifier contract for BaseDB (no sync-manager dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type { DB_Object } from '@nu-art/ts-common';

/**
 * Payload passed to SyncNotifier.onPostWrite (same shape as post-write data from collection hooks).
 */
export type SyncNotifierPostWriteData = {
	before?: DB_Object | DB_Object[];
	updated?: DB_Object | DB_Object[];
	deleted?: DB_Object | DB_Object[] | null;
};

/**
 * Options for onPostWrite (collection uniqueKeys and optional transaction).
 */
export type SyncNotifierOnPostWriteOptions = {
	uniqueKeys?: string[];
	transaction?: unknown;
};

/**
 * Contract for sync side-effects used by ModuleBE_BaseDB.
 * Implemented by sync-manager (or a no-op stub when sync is not used).
 * BaseDB receives an implementation via config.syncNotifier; when absent, a no-op is used.
 */
export interface SyncNotifier {
	onPostWrite(collectionName: string, data: SyncNotifierPostWriteData, options: SyncNotifierOnPostWriteOptions): Promise<void>;
}
