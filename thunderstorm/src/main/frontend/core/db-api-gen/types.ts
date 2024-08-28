import {DBProto} from '@thunder-storm/common';
import {ThunderDispatcher} from '../thunder-dispatcher';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';


export type SingleApiEvent = 'create' | 'update' | 'unique' | 'delete' | 'patch'
export type MultiApiEvent = 'query' | 'upsert-all' | 'sync' | 'delete-multi'

export type ApiCallerEventType<Proto extends DBProto<any>> =
	[SingleApiEvent, Proto['dbType']]
	| [MultiApiEvent, Proto['dbType'][]];

export interface OnSyncStatusChangedListener<Proto extends DBProto<any>> {
	__onSyncStatusChanged: (module: ModuleFE_BaseDB<Proto['dbType'], any>) => void;
}

export type DispatcherInterface<Def extends DispatcherDef<any, any>> = {
	[K in Def['eventName']]: Def['method']
}

export type DispatcherDef<Proto extends DBProto<any>, MethodName extends `${'__'}${string}`> = {
	eventName: MethodName
	method: (...params: ApiCallerEventType<Proto>) => void
}

export class ThunderDispatcherV3<T extends DispatcherDef<any, any>>
	extends ThunderDispatcher<{ [K in T['eventName']]: T['method'] }, T['eventName']> {
}
