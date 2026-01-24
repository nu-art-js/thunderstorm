/*
 * Test entry point - exports test utilities for page.evaluate()
 * Only imports what's needed for tests to avoid pulling in node-specific dependencies
 */
import {IDBManager} from '../main/IDBManager.js';
import {IndexedDB_Store} from '../main/IndexedDB_Store.js';
import {IndexedDB_Database} from '../main/IndexedDB_Database.js';

// Expose on window for page.evaluate() access
declare global {
	interface Window {
		IDBFrontend: {
			IDBManager: typeof IDBManager;
			IndexedDB_Store: typeof IndexedDB_Store;
			IndexedDB_Database: typeof IndexedDB_Database;
		};
	}
}

window.IDBFrontend = {
	IDBManager,
	IndexedDB_Store,
	IndexedDB_Database,
};

export {IDBManager, IndexedDB_Store, IndexedDB_Database};
