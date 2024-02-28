import {_values, Logger, LogLevel, Queue, TypedMap} from '@nu-art/ts-common';
import {DBConfigV3, IndexedDB_Database_Status} from './types';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export class IndexedDB_Database
	extends Logger {

	private db!: IDBDatabase;
	private dbName: string;
	private status: IndexedDB_Database_Status = IndexedDB_Database_Status.Closed;
	private openPromise!: Promise<IndexedDB_Database>;
	private openStoreQueue: Queue;

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
		this.openStoreQueue = new Queue(config.group);
		IndexedDB_Database.dbs[config.group] = this;
	}

	// ######################## Readiness ########################

	private setStatus = (status: IndexedDB_Database_Status) => {
		this.logVerbose(`Setting status ${this.status} => ${status}`);
		this.status = status;
	};

	async open(onUpgradeCallback?: (db: IDBDatabase) => void): Promise<IndexedDB_Database> {
		if (this.status === IndexedDB_Database_Status.Opening)
			return this.openPromise;

		this.setStatus(IndexedDB_Database_Status.Opening);
		return this.openPromise = new Promise((resolve, reject) => {
			if (!IDBAPI)
				reject(new Error('Error - current browser does not support IndexedDB'));

			const request = IDBAPI.open(this.dbName);
			request.onupgradeneeded = () => {
				onUpgradeCallback?.(request.result);
			};

			request.onsuccess = () => {
				this.logDebug(`Successfully opened IDB - ${this.dbName}`);
				this.db = request.result;
				this.setStatus(IndexedDB_Database_Status.Opened);
				resolve(this);
			};

			request.onerror = () => {
				reject(new Error(`Error opening IDB - ${this.dbName}`));
			};
		});
	}

	isOpen = () => this.status === IndexedDB_Database_Status.Opened;

	// ######################## Store Interaction ########################

	registerStore = (config: DBConfigV3<any>) => {
		this.logDebug(`Registering store: ${config.name}`);
		this.openStoreQueue.addItem(async () => {
			this.logDebug(`Opening store: ${config.name}`);
			await this.open(db => {
				const store = db.createObjectStore(config.name, {
					autoIncrement: config.autoIncrement,
					keyPath: config.uniqueKeys as unknown as string[]
				});
				config.indices?.forEach(index => store.createIndex(index.id, index.keys as string | string[], {
					multiEntry: index.params?.multiEntry,
					unique: index.params?.unique
				}));
				config.upgradeProcessor?.(db);
			});
		});
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