/*
 * Test entry point - exports test utilities for page.evaluate()
 * Only imports what's needed for tests to avoid pulling in node-specific dependencies
 */

import {IDB_Database} from '../main/IDB_Database.js';
import {IDB_Store} from '../main/IDB_Store.js';
import {IDB_StoreIndex} from '../main/IDB_StoreIndex.js';
import {cleanupAllIDB} from './test-utils.js';

// Expose on window for page.evaluate() access
declare global {
	interface Window {
		IDBFrontend: {
			IDB_Database: typeof IDB_Database;
			IDB_Store: typeof IDB_Store;
			IDB_StoreIndex: typeof IDB_StoreIndex;
			cleanupAllIDB: typeof cleanupAllIDB;
		};
	}
}

window.IDBFrontend = {
	IDB_Database,
	IDB_Store,
	IDB_StoreIndex,
	cleanupAllIDB,
};

export {IDB_Database, IDB_Store, IDB_StoreIndex, cleanupAllIDB};
