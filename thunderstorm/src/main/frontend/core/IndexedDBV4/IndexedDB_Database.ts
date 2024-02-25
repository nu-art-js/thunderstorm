import {_values, Logger, LogLevel, TypedMap} from '@nu-art/ts-common';
import {DBConfigV3, IndexedDB_Database_Status} from './types';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export class IndexedDB_Database
	extends Logger {

	private db!: IDBDatabase;
	private dbName: string;
	private status: IndexedDB_Database_Status = IndexedDB_Database_Status.Closed;
	private storeConfigs: TypedMap<DBConfigV3<any>> = {};
	private openPromise!: Promise<IndexedDB_Database>;

	// ######################## Static ########################

	static dbs: TypedMap<IndexedDB_Database> = {};

	static getOrCreate = (config: DBConfigV3<any>): IndexedDB_Database => {
		let idb = this.dbs[config.group];
		if (!idb)
			idb = new IndexedDB_Database(config);
		return idb;
	};

	// ######################## Init ########################

	constructor(config: DBConfigV3<any>) {
		super(`IDB_Database-${config.group}`);
		this.setMinLevel(LogLevel.Verbose);
		this.dbName = config.group;
		IndexedDB_Database.dbs[config.group] = this;
	}

	// ######################## Readiness ########################

	private setStatus = (status: IndexedDB_Database_Status) => {
		this.logDebug(`Setting status ${this.status} => ${status}`);
		this.status = status;
	};

	async open(): Promise<IndexedDB_Database> {
		if (this.status === IndexedDB_Database_Status.Opening)
			return this.openPromise;

		this.setStatus(IndexedDB_Database_Status.Opening);
		return this.openPromise = new Promise((resolve, reject) => {
			if (!IDBAPI)
				reject(new Error('Error - current browser does not support IndexedDB'));

			const request = IDBAPI.open(this.dbName);
			request.onupgradeneeded = () => {
				this.createStores(request.result);
			};

			request.onsuccess = () => {
				this.logDebug(`Successfully opened IDB - ${this.dbName}`);
				this.db = request.result;
				this.setStatus(IndexedDB_Database_Status.Opened);
				this.logInfo(`DB ${this.dbName} is opened`);
				resolve(this);
			};

			request.onerror = () => {
				reject(new Error(`Error opening IDB - ${this.dbName}`));
			};
		});
	}

	isOpen = () => this.status === IndexedDB_Database_Status.Opened;

	// ######################## Store Interaction ########################

	createStores = (db: IDBDatabase) => {
		this.logWarningBold(`Creating Stores`);
		_values(this.storeConfigs).forEach(config => {
			if (!db.objectStoreNames.contains(config.name)) {
				const store = db.createObjectStore(config.name, {
					autoIncrement: config.autoIncrement,
					keyPath: config.uniqueKeys as unknown as string[]
				});
				config.indices?.forEach(index => store.createIndex(index.id, index.keys as string | string[], {
					multiEntry: index.params?.multiEntry,
					unique: index.params?.unique
				}));
			}
			config.upgradeProcessor?.(db);
		});
	};

	registerStore = (config: DBConfigV3<any>) => {
		this.storeConfigs[config.name] = config;
	};

	removeStore = (config: DBConfigV3<any>) => {
		delete this.storeConfigs[config.name];
	};

	async getStore(config: DBConfigV3<any>, write = false, _store?: IDBObjectStore) {
		if (_store)
			return _store;

		if (!this.isOpen())
			await this.open();

		return this.db.transaction(config.name, write ? 'readwrite' : 'readonly').objectStore(config.name);
	}

	storeExists = async (storeName: string) => {
		if (!this.isOpen())
			await this.open();

		return this.db.objectStoreNames.contains(storeName);
	};
}