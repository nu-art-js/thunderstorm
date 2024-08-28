import {DBProto, TypedMap} from '@thunder-storm/common';
import {IndexedDB_Database} from './IndexedDB_Database';
import {DBConfigV3} from './types';
import {IndexedDB_Store} from './IndexedDB_Store';


export class ModuleFE_IDBManager_Class {
	databases: TypedMap<IndexedDB_Database> = {};

	register<Proto extends DBProto<any>>(dbConfig: DBConfigV3<Proto>, onDBOpenCallback: VoidFunction) {
		const indexDb = this.databases[dbConfig.group] || (this.databases[dbConfig.group] = new IndexedDB_Database(dbConfig.group));
		indexDb.registerStore(dbConfig, onDBOpenCallback);

		return new IndexedDB_Store(dbConfig, this.storeResolver, this.storeExistsResolver);
	}

	private storeResolver = async <Proto extends DBProto<any>>(dbConfig: DBConfigV3<Proto>, write: boolean = false, store?: IDBObjectStore) => {
		const dbWrapper = this.databases[dbConfig.group];
		return dbWrapper.getStore(dbConfig, write, store);
	};

	private storeExistsResolver = async <Proto extends DBProto<any>>(dbConfig: DBConfigV3<Proto>) => {
		const dbWrapper = this.databases[dbConfig.group];
		return await dbWrapper.storeExists(dbConfig.name);
	};
}

export const ModuleFE_IDBManager = new ModuleFE_IDBManager_Class();
