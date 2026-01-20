/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AsyncVoidFunction, TypedMap} from '@nu-art/ts-common';
import {DBConfig} from '@nu-art/idb-shared';
import {IndexedDB_Database} from './IndexedDB_Database.js';
import {IndexedDB_Store} from './IndexedDB_Store.js';


export class IDBManager_Class {
	databases: TypedMap<IndexedDB_Database> = {};

	register<ItemType extends object>(dbConfig: DBConfig<ItemType>, onDBOpenCallback: AsyncVoidFunction) {
		const indexDb = this.databases[dbConfig.group] || (this.databases[dbConfig.group] = new IndexedDB_Database(dbConfig.group));
		indexDb.registerStore(dbConfig, onDBOpenCallback);

		return new IndexedDB_Store(dbConfig, this.storeResolver, this.storeExistsResolver);
	}

	private storeResolver = async <ItemType extends object>(dbConfig: DBConfig<ItemType>, write: boolean = false, store?: IDBObjectStore) => {
		const dbWrapper = this.databases[dbConfig.group];
		return dbWrapper.getStore(dbConfig, write, store);
	};

	private storeExistsResolver = async <ItemType extends object>(dbConfig: DBConfig<ItemType>) => {
		const dbWrapper = this.databases[dbConfig.group];
		return await dbWrapper.storeExists(dbConfig.name);
	};
}

export const IDBManager = new IDBManager_Class();
