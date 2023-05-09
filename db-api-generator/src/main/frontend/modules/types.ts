import {DB_Object} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {ModuleFE_BaseDB} from './ModuleFE_BaseDB';
import {ModuleFE_BaseApi} from './ModuleFE_BaseApi';


export type DBItemApiCaller<T extends DB_Object, Ks extends keyof T = '_id'> = ModuleFE_BaseApi<T, Ks> | ModuleFE_BaseApi<T, Ks>;

export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export interface OnSyncStatusChangedListener<DBType extends DB_Object> {
	__onSyncStatusChanged: (module: ModuleFE_BaseDB<DBType, any>) => void;
}