import {DBProto} from '@nu-art/ts-common';
import {DBApiFEConfig} from '../../core/db-api-gen/db-def.js';
import {DBConfigV3} from '@nu-art/thunder-idb';
import {IDBCache, MemCache, ModuleFE_BaseDB} from './ModuleFE_BaseDB.js';

export enum ModuleSyncType {
	NoSync,
	CSVSync,
	APISync
}

export type CustomMemCreators<Proto extends DBProto<any>> = {
	memCache?: (_config: DBApiFEConfig<Proto>, _this: ModuleFE_BaseDB<Proto, any>) => MemCache<Proto>,
	idbCache?: (dbConfig: DBConfigV3<Proto>, dbKey: string) => IDBCache<Proto>
};
