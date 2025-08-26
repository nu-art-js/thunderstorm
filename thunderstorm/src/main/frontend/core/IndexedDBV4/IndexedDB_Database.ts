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
		this.setMinLevel(LogLevel.Info);
		this.dbName = dbName;
	}

	// ######################## DB Interaction ########################

	clearDB = async () => {
		const t0 = performance.now?.() ?? Date.now();
		this.logInfo(`[CLEAR] Requested clear for DB="${this.dbName}"`);

		return new Promise<void>(async (resolve, reject) => {
			try {
				//db is closed & not awaiting opening
				if (!this.db && !this.openPromise) {
					this.logDebug(`[CLEAR DB] DB not open and no openPromise pending — nothing to clear`);
					return resolve();
				}

				if (this.openPromise) {
					this.logDebug(`[CLEAR-DB] Awaiting ongoing openPromise before clearing`);
					await this.openPromise;
				}

				const storeNames = Array.from(this.db.objectStoreNames);
				this.logInfo(`[CLEAR-DB] Deleting ${storeNames.length} stores: ${storeNames.join(', ') || '(none)'}`);
				storeNames.forEach(storeName => {
					this.db.deleteObjectStore(storeName);
				});
				this.db.close();
				const dt = (performance.now?.() ?? Date.now()) - t0;
				this.logInfo(`[CLEAR-DB] Completed in ${Math.round(dt)}ms`);
				resolve();
			} catch (err) {
				this.logErrorBold(`[CLEAR-DB] Failed: ${err}`);
				reject(err);
			}
		});
	};

	// ######################## Store Interaction ########################

	registerStore = (dbConfig: DBConfigV3<any>, onDBOpenCallback?: AsyncVoidFunction) => {
		const registeredStore: RegisteredStore = {config: dbConfig, onDBOpenCallback};
		(this.registeredStores || (this.registeredStores = [])).push(registeredStore);
		this.logDebug('[REGISTER-STORE]', `Store: ${dbConfig.name}`, `Group: ${dbConfig.group}`, `Auto Increment: ${!!dbConfig.autoIncrement}`, `Indices: ${dbConfig.indices?.length ?? 0}`);
	};

	async getStore(config: DBConfigV3<any>, write = false, _store?: IDBObjectStore): Promise<IDBObjectStore> {
		if (_store)
			return _store;

		try {
			this.logDebug(`[GET-STORE] Request for "${config.name}"`, `write: ${write}`);
			await this.open();
			const tx = this.db.transaction(config.name, write ? 'readwrite' : 'readonly');
			const store = tx.objectStore(config.name);
			this.logVerboseBold(`[GET-STORE] OK "${config.name}"`, `(mode: ${write ? 'rw' : 'ro'})`);
			return store;
		} catch (err: any) {
			this.logError(`Failed to get store for collection '${config.group}/${config.name}'`);
			throw err;
		}
	}

	storeExists = async (storeName: string): Promise<boolean> => {
		await this.open();
		const exists = this.db.objectStoreNames.contains(storeName);
		this.logDebug(`[STORE-EXISTS] store="${storeName}" => ${exists}`, '');
		return exists;
	};

	async open() {
		if (this.db) {
			this.logDebug(`[OPEN] Already open: returning existing connection`, `DB Name: ${this.db.name}`);
			return;
		}

		if (this.openPromise) {
			this.logDebug(`[OPEN] Re-entrant call — awaiting existing openPromise`, `DB Name: ${this.dbName}`);
			return this.openPromise;
		}

		try {
			return await this.open_Impl();
		} catch (err: any) {
			if (err instanceof DOMException && err.name === 'VersionError') {
				return this.open_Impl(true);
			} else {
				throw new Error(`Error opening IDB - ${this.dbName}`);
			}
		}
	}

	private open_Impl = (ignoreCurrentVersion: boolean = false) => {
		const start = performance.now?.() ?? Date.now();
		const openId = Math.random().toString(36).slice(2, 8); // useful when correlating logs
		this.logInfo(`[OPEN: ${openId}] - Starting open`, '');

		return this.openPromise = new Promise((resolve, reject) => {
			if (!IDBAPI) {
				this.logErrorBold(`[OPEN:${openId}] Error — current browser does not support IndexedDB`);
				delete this.openPromise;
				return reject(new Error('Error - current browser does not support IndexedDB'));
			}

			let nextVersion: VersionData | undefined;
			if (!ignoreCurrentVersion) {
				const nextVersion = this.getNextVersionData();
				const currentVersionData = this.getCurrentVersionData();
				this.logDebug(
					`[OPEN: ${openId}] Attempting open DB: "${this.dbName}"`,
					`currentVersion: ${currentVersionData?.version ?? 0}, nextVersion: ${nextVersion.version},`,
					`currentHash: ${currentVersionData?.hash ?? '-'}, nextHash: ${nextVersion.hash}`
				);
			}

			const request = IDBAPI.open(this.dbName, nextVersion?.version);

			request.onblocked = (e) => {
				this.logWarningBold(`[OPEN:${openId}] onblocked — Another tab/process holds the old version open`, e);
			};

			request.onupgradeneeded = async () => {
				const upStart = performance.now?.() ?? Date.now();
				this.logInfo(`[OPEN:${openId}] onupgradeneeded`, `Current Version: ${this.getCurrentVersionData()?.version ?? 0}`, `Next Version: ${nextVersion?.version ?? 'N/A'}`);
				const db = request.result;
				const duplicatedStores = new Set<string>();
				try {
					this.registeredStores.forEach(registeredStore => {
						//Don't create a store that already exists
						if (db.objectStoreNames.contains(registeredStore.config.name)) {
							this.logVerboseBold(`[OPEN:${openId}] Store already exists!`, `Store Name: ${registeredStore.config.name}`);
							return duplicatedStores.add(registeredStore.config.name);
						}

						const options: IDBObjectStoreParameters = {
							autoIncrement: registeredStore.config.autoIncrement,
							keyPath: registeredStore.config.uniqueKeys as unknown as string[]
						};

						const store = db.createObjectStore(registeredStore.config.name, options);
						this.logDebug(`[OPEN:${openId}] Created store`, `Store Name: ${registeredStore.config.name}`, `KeyPath: ${JSON.stringify(options.keyPath)}`, `AutoIncrement: ${!!options.autoIncrement}`);

						registeredStore.config.indices?.forEach(index => {
							store.createIndex(index.id, index.keys as string | string[], {
								multiEntry: index.params?.multiEntry,
								unique: index.params?.unique
							});
							this.logDebug(`[OPEN:${openId}] Index`, `IndexID: ${index.id}`, `Keys: ${JSON.stringify(index.keys)}`, `Unique: ${!!index.params?.unique}`, `Multi: ${!!index.params?.multiEntry}`);
						});

						try {
							registeredStore.config.upgradeProcessor?.(store);
							if (registeredStore.config.upgradeProcessor)
								this.logDebug(`[OPEN:${openId}] UpgradeProcessor Executed for`, `Store Name: ${registeredStore.config.name}`);
						} catch (upgradeErr) {
							this.logErrorBold(`[OPEN:${openId}] UpgradeProcessor Failed for`, `Store Name: ${registeredStore.config.name}`, `Error: ${JSON.stringify(upgradeErr)}`);
						}
					});

					this.setCurrentVersionData({version: db.version, hash: this.generateVersionHash()});
					if (duplicatedStores.size)
						this.logWarningBold(`[OPEN:${openId}] Duplicate store registrations detected`, ...Array.from(duplicatedStores));
				} catch (e) {
					this.logErrorBold(`[OPEN:${openId}] onupgradeneeded failed`, e as Error);
				} finally {
					const upDt = (performance.now?.() ?? Date.now()) - upStart;
					this.logInfo(`[OPEN:${openId}] onupgradeneeded completed in ${Math.round(upDt)}ms`);
				}
			};

			request.onsuccess = async () => {
				const tConn = (performance.now?.() ?? Date.now()) - start;
				try {
					const storesLength = request.result.objectStoreNames.length;
					this.logInfo(`[OPEN:${openId}] OnSuccess — Opened`, `dbName: ${this.dbName}`, `Store Amount: ${storesLength}`, `Completion Time: ${Math.round(tConn)}ms`);
					this.db = request.result;

					// Defensive: log connection lifecycle events
					this.db.onversionchange = (ev) => {
						this.logWarningBold(`[OPEN:${openId}] db.onversionchange fired — closing connection`, ev);
						try {
							this.db.close();
						} catch {
						}
					};
					this.db.onclose = () => this.logInfo(`[OPEN:${openId}] db.onclose`);
					this.db.onerror = (ev) => this.logErrorBold(`[OPEN:${openId}] db.onerror`, ev);

					// Run open callbacks with full timing & error capture
					await this.onDBOpen(openId);

					resolve(this);
					delete this.openPromise;

					// Persist version (again) to ensure it’s set even if there was no upgrade
					this.setCurrentVersionData({version: this.db.version, hash: this.generateVersionHash()});
					this.logDebug(`[OPEN:${openId}] Completed open()`,'');
				} catch (err) {
					this.logErrorBold(`[OPEN:${openId}] Failure during onDBOpen(): ${err}`);
					delete this.openPromise;
					reject(err);
				}
			};

			request.onerror = (e) => {
				this.logErrorBold(`[OPEN:${openId}] request.onerror — failed to open DB "${this.dbName}"`, e);
				delete this.openPromise;
				reject(request.error);
			};
		});
	};

	private onDBOpen = async (openId?: string) => {
		const tag = openId ? `OPEN:${openId}` : `OPEN`;
		const allStart = performance.now?.() ?? Date.now();

		if (!this.registeredStores?.length) {
			this.logDebug(`[${tag}] onDBOpen`, 'No registered stores — nothing to notify');
			return;
		}

		this.logInfo(`[${tag}] onDBOpen`, `Invoking ${this.registeredStores.length} store callbacks`);
		for (const store of this.registeredStores) {
			const name = store.config?.name ?? '(unknown-store)';
			if (!store.onDBOpenCallback) {
				this.logDebug(`[${tag}] onDBOpen: Store "${name}" has no callback`, '');
				continue;
			}

			const cbStart = performance.now?.() ?? Date.now();
			let returned: any;
			let isAsync = false;

			try {
				returned = store.onDBOpenCallback();
				isAsync = !!returned && typeof returned.then === 'function';
				this.logDebug(`[${tag}] onDBOpen: "${name}" Callback Invoked`, `Async: ${isAsync}`);

				// Always await to preserve ordering
				await returned;
				const cbDt = (performance.now?.() ?? Date.now()) - cbStart;
				this.logVerboseBold(`[${tag}] onDBOpen: "${name}" Callback Completed`, `Completion Time: ${Math.round(cbDt)}ms`);
			} catch (err) {
				const cbDt = (performance.now?.() ?? Date.now()) - cbStart;
				this.logErrorBold(`[${tag}] onDBOpen: "${name}" Callback FAILED`, `Elapsed Time: ${Math.round(cbDt)}ms`, err as Error);
				throw err;
			}
		}

		const allDt = (performance.now?.() ?? Date.now()) - allStart;
		this.logInfo(`[${tag}] onDBOpen: All callbacks completed`, `Completion Time: ${Math.round(allDt)}ms`);
	};

	// ######################## Version Control ########################

	private getCurrentVersionData = (): VersionData | undefined => {
		const storage = new StorageKey<VersionData>(`idb-version-data__${this.dbName}`);
		const data = storage.get();
		this.logDebug(`[VERSION] getCurrentVersionData => v=${data?.version ?? '-'}`, `Hash: ${data?.hash ?? '-'}`);
		return data;
	};

	private setCurrentVersionData = (versionData: VersionData): VersionData => {
		const storage = new StorageKey<VersionData>(`idb-version-data__${this.dbName}`);
		storage.set(versionData);
		this.logDebug(`[VERSION] setCurrentVersionData => v=${versionData.version}`, `Hash: ${versionData.hash}`);
		return versionData;
	};

	private generateVersionHash = () => {
		const stores = sortArray(this.registeredStores, i => i.config.name);
		const hash = md5(stores.map(i => i.config.name).join(','));
		this.logDebug(`[VER] generateVersionHash => ${hash} from [${stores.map(s => s.config.name).join(', ')}]`, '');
		return hash;
	};

	private getNextVersionData = (): VersionData => {
		const currentVersionData = this.getCurrentVersionData();
		const hash = this.generateVersionHash();

		if (hash === currentVersionData?.hash) {
			this.logDebug(`[VER] Hash unchanged — keeping version ${currentVersionData.version}`, '');
			return currentVersionData;
		}

		const next: VersionData = {
			version: ((currentVersionData?.version ?? 0) + 1),
			hash
		};
		this.logInfo(`[VER] Hash changed — bumping version to ${next.version}`, '');
		return next;
	};
}
