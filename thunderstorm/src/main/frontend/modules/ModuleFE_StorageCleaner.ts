import {Module} from '@thunder-storm/common';
import {StorageKey} from './ModuleFE_LocalStorage';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

class ModuleFE_StorageCleaner_Class
	extends Module {

	// ######################## Public Functions ########################

	public cleanLocalStorage = (storageKeys?: StorageKey[]): void => {
		if (!storageKeys?.length) {
			this.logInfo('Clearing all local-storage');
			return localStorage.clear();
		}

		storageKeys.forEach(storageKey => {
			//Delete only local storage keys
			if (!storageKey.getPersistence())
				return;
			localStorage.removeItem(storageKey.key);
			this.logDebug(`Cleared local-storage for key ${storageKey.key}`);
		});
	};

	public cleanSessionStorage = (storageKeys?: StorageKey[]): void => {
		if (!storageKeys?.length) {
			this.logInfo('Clearing all session-storage');
			return sessionStorage.clear();
		}

		storageKeys.forEach(storageKey => {
			//Delete only session storage keys
			if (storageKey.getPersistence())
				return;

			sessionStorage.removeItem(storageKey.key);
			this.logDebug(`Cleared session-storage for key ${storageKey.key}`);
		});
	};

	public cleanIDBStorage = async () => {
		this.logInfo('Clearing all IDBs');
		const databases = await IDBAPI.databases();
		await Promise.all(databases.map(this.cleanIDBImpl));
		this.logInfo('Cleared all IDBs');
	};

	public cleanCache = async () => {
		const cacheNames = await caches.keys();
		this.logInfo('Clearing cache');
		await Promise.all(cacheNames.map(async cacheName => await caches.delete(cacheName)));
		this.logInfo('Cleared cache');
	};

	public cleanCookies = () => {
		const cookies = document.cookie.split(';');
		cookies.forEach(cookie => {
			const name = cookie.split('=')[0];
			//expires= tells the browser to expire the cookie and discard it.
			//path=/ sets the cookie to expire across the domain, not a specific path.
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		});
		this.logInfo('Cleaned all cookies');
	};

	/**
	 *
	 * @param callback - Any interaction with storage must be through this callback
	 */
	public cleanAll = async (callback?: VoidFunction) => {
		this.cleanLocalStorage();
		this.cleanSessionStorage();
		this.cleanCookies();
		await this.cleanCache();
		await this.cleanIDBStorage();
		if (callback) {
			await new Promise<void>(resolve => {
				setTimeout(() => {
					callback();
					resolve();
				});
			});
		}
	};

	// ######################## Internal Logic ########################

	private cleanIDBImpl = async (info: IDBDatabaseInfo) => {
		return new Promise<void>((resolve, reject) => {
			if (!info.name) {
				return resolve();
			}

			const request = IDBAPI.deleteDatabase(info.name);

			request.onerror = e => {
				return reject(request.error);
			};

			request.onsuccess = e => {
				this.logInfo(`IDB ${info.name} cleared`);
				resolve();
			};
		});
	};
}

export const ModuleFE_StorageCleaner = new ModuleFE_StorageCleaner_Class();