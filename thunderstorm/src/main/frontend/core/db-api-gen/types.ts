import {DB_Object} from '@nu-art/ts-common';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';


export type SingleApiEvent = 'create' | 'update' | 'unique' | 'delete' | 'patch'
export type MultiApiEvent = 'query' | 'upsert-all' | 'sync' | 'delete-multi'

export type ApiCallerEventType<DBType extends DB_Object> =
	[SingleApiEvent, DBType]
	| [MultiApiEvent, DBType[]];

export interface OnSyncStatusChangedListener<DBType extends DB_Object> {
	__onSyncStatusChanged: (module: ModuleFE_BaseDB<DBType, any>) => void;
}