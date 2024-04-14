import {_values, Module} from '@nu-art/ts-common';
import {StorageKey} from './ModuleFE_LocalStorage';
import {ModuleFE_IDBManager} from '../core/IndexedDBV4/ModuleFE_IDBManager';

class ModuleFE_StorageCleaner_Class
	extends Module {

	public cleanLocalStorage = (storageKeys?: StorageKey[]): void => {
		if (!storageKeys?.length) {
			this.logDebug('Clearing all local-storage');
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
			this.logDebug('Clearing all session-storage');
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
		const databases = _values(ModuleFE_IDBManager.databases);
		this.logDebug('Clearing all IDBs');
		await Promise.all(databases.map(db => db.clearDB()));
		this.logDebug('Cleared all IDBs');
	};

	public cleanCache = async () => {
		const cacheNames = await caches.keys();
		this.logDebug('Clearing cache');
		await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
		this.logDebug('Cleared cache');
	};

	public cleanCookies = () => {
		const cookies = document.cookie.split(';');
		cookies.forEach(cookie => {
			const name = cookie.split('=')[0];
			//expires= tells the browser to expire the cookie and discard it.
			//path=/ sets the cookie to expire across the domain, not a specific path.
			document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		});
		this.logDebug('Cleaned all cookies');
	};
}

export const ModuleFE_StorageCleaner = new ModuleFE_StorageCleaner_Class();