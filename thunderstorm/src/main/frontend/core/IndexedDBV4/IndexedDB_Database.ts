import {AsyncVoidFunction, Logger, LogLevel, md5, sortArray} from '@nu-art/ts-common';
import {DBConfigV3} from './types';
import {StorageKey} from '../../modules/ModuleFE_LocalStorage';

type VersionData = {
	version: number;
	hash: string;
}

type RegisteredStore = {
	config: DBConfigV3<any>;
	onDBOpenCallback?: () => Promise<void>
}

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export class IndexedDB_Database
	extends Logger {

	private dbName: string;
	private db!: IDBDatabase;
	private openPromise?: Promise<IndexedDB_Database>;
	private registeredStores: RegisteredStore[] = [];

	// ######################## Init ########################

	constructor(dbName: string) {
		super(`IDB_Database-${dbName}`);
		this.setMinLevel(LogLevel.Debug);
		this.dbName = dbName;
	}

	// ######################## DB Interaction ########################

	clearDB = async () => {
		return new Promise<void>(async (resolve, reject) => {
			//db is closed & not awaiting opening
			if (!this.db && !this.openPromise)
				return resolve();

			if (this.openPromise)
				await this.openPromise;

			const storeNames = Array.from(this.db.objectStoreNames);
			storeNames.forEach(storeName => {
				this.db.deleteObjectStore(storeName);
			});
			this.db.close();
			resolve();
		});
	};

	// ######################## Store Interaction ########################

	registerStore = (dbConfig: DBConfigV3<any>, onDBOpenCallback?: AsyncVoidFunction) => {
		const registeredStore: RegisteredStore = {config: dbConfig, onDBOpenCallback};
		(this.registeredStores || (this.registeredStores = [])).push(registeredStore);
	};

	async getStore(config: DBConfigV3<any>, write = false, _store?: IDBObjectStore): Promise<IDBObjectStore> {
		if (_store)
			return _store;

		try {
			await this.open();
			return this.db.transaction(config.name, write ? 'readwrite' : 'readonly').objectStore(config.name);
		} catch (err: any) {
			this.logError(`Failed to get store for collection '${config.group}/${config.name}'`);
			throw err;
		}
	}

	storeExists = async (storeName: string): Promise<boolean> => {
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
				return reject(new Error('Error - current browser does not support IndexedDB'));

			const versionData = this.getNextVersionData();
			this.logDebug(`Trying to open IDB - ${this.dbName} with version ${versionData.version}`);
			const request = IDBAPI.open(this.dbName, versionData.version);
			request.onupgradeneeded = async () => {
				this.logInfo(`Upgrading IDB from ${this.getCurrentVersionData()?.version ?? 0} to ${versionData.version}`);
				const db = request.result;

				const duplicatedStores = new Set<string>();

				this.registeredStores.forEach(registeredStore => {
					//Don't create a store that already exists
					if (db.objectStoreNames.contains(registeredStore.config.name)) {
						this.logVerboseBold(`Store ${registeredStore.config.name} already exists in IDB ${this.dbName}`);
						return duplicatedStores.add(registeredStore.config.name);
					}

					const options: IDBObjectStoreParameters = {
						autoIncrement: registeredStore.config.autoIncrement,
						keyPath: registeredStore.config.uniqueKeys as unknown as string[]
					};

					const store = db.createObjectStore(registeredStore.config.name, options);
					registeredStore.config.indices?.forEach(index => store.createIndex(index.id, index.keys as string | string[], {
						multiEntry: index.params?.multiEntry,
						unique: index.params?.unique
					}));

					registeredStore.config.upgradeProcessor?.(store);
				});

				this.setCurrentVersionData(versionData);
				if (duplicatedStores.size)
					this.logWarningBold(`Stores were registered to IDB ${this.dbName} more than once`, ...Array.from(duplicatedStores));
			};

			request.onsuccess = async () => {
				const storesLength = request.result.objectStoreNames.length;
				this.logDebug(`Successfully opened IDB - ${this.dbName} with ${storesLength} stores`);
				this.db = request.result;
				await this.onDBOpen();
				resolve(this);
				delete this.openPromise;
				this.setCurrentVersionData(versionData);
			};

			request.onerror = (e) => {
				this.logErrorBold(`Received error when tried to open IDB store for collection ${this.dbName}`, e);
				reject(new Error(`Error opening IDB - ${this.dbName}`));
				delete this.openPromise;
			};
		});
	}

	private onDBOpen = async () => {
		for (const store of this.registeredStores)
			await store.onDBOpenCallback?.();
	};

	// ######################## Version Control ########################

	private getCurrentVersionData = (): VersionData | undefined => {
		const storage = new StorageKey<VersionData>(`idb-version-data__${this.dbName}`);
		return storage.get();
	};

	private setCurrentVersionData = (versionData: VersionData): VersionData => {
		const storage = new StorageKey<VersionData>(`idb-version-data__${this.dbName}`);
		storage.set(versionData);
		return versionData;
	};

	private generateVersionHash = () => {
		const stores = sortArray(this.registeredStores, i => i.config.name);
		return md5(stores.map(i => i.config.name).join(','));
	};

	private getNextVersionData = (): VersionData => {
		const currentVersionData = this.getCurrentVersionData();
		const hash = this.generateVersionHash();

		if (hash === currentVersionData?.hash)
			return currentVersionData;

		return {
			version: ((currentVersionData?.version ?? 0) + 1),
			hash
		};
	};
}