import {DB_Object} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {ModuleFE_BaseDB} from './ModuleFE_BaseDB';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export interface OnSyncStatusChangedListener<DBType extends DB_Object> {
	__onSyncStatusChanged: (module: ModuleFE_BaseDB<DBType, any>) => void;
}