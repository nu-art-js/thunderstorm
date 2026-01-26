/*
 * Test utilities for IDB tests
 * Provides cleanup functions to ensure test isolation
 */

import {cleanIDBStorage} from '../main/StorageCleaner.js';
import {StorageKeyPrefix_DBStores} from '../main/IDB_Database.js';

/** LocalStorage prefixes used by IDB system */
const IDB_LOCALSTORAGE_PREFIXES = [
	StorageKeyPrefix_DBStores,    // idb-stores--
	'idb-sync--',                 // sync metadata
	'idb-version--'               // version metadata
];

/**
 * Clears ALL IndexedDB databases and ALL IDB-related localStorage keys.
 * Call this in beforeEach() to ensure complete test isolation.
 */
export async function cleanupAllIDB(): Promise<void> {
	// Clear all IDB databases
	await cleanIDBStorage();

	// Clear all IDB-related localStorage keys
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && IDB_LOCALSTORAGE_PREFIXES.some(prefix => key.startsWith(prefix)))
			keysToRemove.push(key);
	}
	keysToRemove.forEach(k => localStorage.removeItem(k));
}
