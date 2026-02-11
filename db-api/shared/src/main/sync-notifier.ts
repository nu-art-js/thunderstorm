/*
 * @nu-art/db-api-shared - Sync notifier contract for BaseDB (no sync-manager dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object, UniqueId} from '@nu-art/ts-common';
import type {FirestoreQuery} from '@nu-art/firebase-shared';

/**
 * Item shape returned by queryDeleted (deleted-docs collection entry).
 * Backend may attach __collectionName and __docId for sync payloads.
 */
export type SyncNotifierDeletedItem = DB_Object & { __collectionName?: string; __docId?: UniqueId };

/**
 * Contract for sync side-effects used by ModuleBE_BaseDB.
 * Implemented by sync-manager (or a no-op stub when sync is not used).
 * BaseDB receives an implementation via config.syncNotifier; when absent, a no-op is used.
 */
export interface SyncNotifier {
	queryDeleted(collectionName: string, query: FirestoreQuery<DB_Object>): Promise<SyncNotifierDeletedItem[]>;
	setLastUpdated(collectionName: string, lastUpdated: number): Promise<void>;
	onItemsDeleted(collectionName: string, items: DB_Object[], uniqueKeys?: string[], transaction?: unknown): Promise<void>;
	setOldestDeleted(collectionName: string, oldestDeleted: number): Promise<void>;
}
