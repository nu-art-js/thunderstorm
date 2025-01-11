import {DBProto} from '@nu-art/ts-common';
import {DBApiFEConfig} from '../../core/db-api-gen/db-def';
import {DBConfigV3} from '../../core/IndexedDBV4/types';
import {IDBCache, MemCache, ModuleFE_BaseDB} from './ModuleFE_BaseDB';

export enum ModuleSyncType {
	NoSync,
	CSVSync,
	APISync
}

export type CustomMemCreators<Proto extends DBProto<any>> = {
	memCache?: (_config: DBApiFEConfig<Proto>, _this: ModuleFE_BaseDB<Proto, any>) => MemCache<Proto>,
	idbCache?: (dbConfig: DBConfigV3<Proto>, dbKey: string) => IDBCache<Proto>
};
