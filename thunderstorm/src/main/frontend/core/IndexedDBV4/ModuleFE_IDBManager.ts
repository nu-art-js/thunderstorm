import {DBProto, TypedMap} from '@nu-art/ts-common';
import {IndexedDB_Database} from './IndexedDB_Database';
import {DBConfigV3} from './types';
import {IndexedDB_Store} from './IndexedDB_Store';


export class ModuleFE_IDBManager_Class {
	databases: TypedMap<IndexedDB_Database> = {};

	register<Proto extends DBProto<any>>(dbConfig: DBConfigV3<Proto>) {
		const indexDb = this.databases[dbConfig.group] || (this.databases[dbConfig.group] = new IndexedDB_Database(dbConfig.group));
		indexDb.registerStore(dbConfig);

		return new IndexedDB_Store(dbConfig, this.storeResolver);
	}

	private storeResolver = async <Proto extends DBProto<any>>(dbConfig: DBConfigV3<Proto>, write: boolean = false, store?: IDBObjectStore) => {
		const dbWrapper = this.databases[dbConfig.group];
		return dbWrapper.getStore(dbConfig, write, store);
	};
}

export const ModuleFE_IDBManager = new ModuleFE_IDBManager_Class();
