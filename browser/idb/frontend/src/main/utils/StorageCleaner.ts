/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

/**
 * Clears all IndexedDB databases
 */
export const cleanIDBStorage = async (): Promise<void> => {
	console.log('Clearing all IDBs');
	const databases = await IDBAPI.databases();
	await Promise.all(databases.map(cleanIDBImpl));
	console.log('Cleared all IDBs');
};

/**
 * Clears a specific IndexedDB database
 */
const cleanIDBImpl = async (info: IDBDatabaseInfo): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		if (!info.name) {
			return resolve();
		}

		const request = IDBAPI.deleteDatabase(info.name);

		request.onerror = () => {
			return reject(request.error);
		};

		request.onsuccess = () => {
			console.log(`IDB ${info.name} cleared`);
			resolve();
		};
	});
};
