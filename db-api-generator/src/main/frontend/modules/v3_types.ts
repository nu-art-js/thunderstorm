import {DBProto} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {ModuleFE_BaseDB} from './ModuleFE_BaseDB';


export type ApiCallerEventTypeV3<Proto extends DBProto<any>> =
	[SingleApiEvent, Proto['dbType']]
	| [MultiApiEvent, Proto['dbType'][]];

export interface OnSyncStatusChangedListener<Proto extends DBProto<any>> {
	__onSyncStatusChanged: (module: ModuleFE_BaseDB<Proto['dbType'], any>) => void;
}