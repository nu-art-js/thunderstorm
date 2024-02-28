import {Logger, LogLevel} from '@nu-art/ts-common';
import {DBConfigV3} from './types';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export class IndexedDB_Database
	extends Logger {

	private dbName: string;
	private db!: IDBDatabase;
	private openPromise?: Promise<IndexedDB_Database>;
	private registeredStores: DBConfigV3<any>[] = [];

	// ######################## Init ########################

	constructor(dbName: string) {
		super(`IDB_Database-${dbName}`);
		this.setMinLevel(LogLevel.Verbose);
		this.dbName = dbName;
	}

	// ######################## Store Interaction ########################

	registerStore = (dbConfig: DBConfigV3<any>) => {
		this.logDebug(`Registering store: ${dbConfig.name}`);
		(this.registeredStores || (this.registeredStores = [])).push(dbConfig);
	};

	async getStore(config: DBConfigV3<any>, write = false, _store?: IDBObjectStore) {
		if (_store)
			return _store;

		await this.open();
		return this.db.transaction(config.name, write ? 'readwrite' : 'readonly').objectStore(config.name);
	}

	storeExists = async (storeName: string) => {
		await this.open();
		return this.db.objectStoreNames.contains(storeName);
	};

	async open() {
		if (this.db)
			return;

		if (this.openPromise)
			return this.openPromise;

		return this.openPromise = new Promise((resolve, reject) => {
			if (!IDBAPI)
				reject(new Error('Error - current browser does not support IndexedDB'));

			const request = IDBAPI.open(this.dbName);
			request.onupgradeneeded = () => {
				const db = request.result;

				this.registeredStores.forEach(dbConfig => {
					const options: IDBObjectStoreParameters = {
						autoIncrement: dbConfig.autoIncrement,
						keyPath: dbConfig.uniqueKeys as unknown as string[]
					};

					const store = db.createObjectStore(dbConfig.name, options);
					dbConfig.indices?.forEach(index => store.createIndex(index.id, index.keys as string | string[], {
						multiEntry: index.params?.multiEntry,
						unique: index.params?.unique
					}));

					dbConfig.upgradeProcessor?.(store);
				});
			};

			request.onsuccess = () => {
				this.logDebug(`Successfully opened IDB - ${this.dbName}`);
				this.db = request.result;
				resolve(this);
				delete this.openPromise;
			};

			request.onerror = () => {
				reject(new Error(`Error opening IDB - ${this.dbName}`));
				delete this.openPromise;
			};
		});
	}
}