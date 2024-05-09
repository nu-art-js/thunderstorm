import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiStruct_PermissionAPI, DBDef_PermissionAPI, DBProto_PermissionAPI} from '../shared';


export type DispatcherType_PermissionAPI = DispatcherDef<DBProto_PermissionAPI, `__onPermissionAPIUpdated`>;

export const dispatch_onPermissionAPIChanged = new ThunderDispatcherV3<DispatcherType_PermissionAPI>('__onPermissionAPIUpdated');

export class ModuleFE_PermissionAPI_Class
	extends ModuleFE_BaseApi<DBProto_PermissionAPI>
	implements ApiDefCaller<ApiStruct_PermissionAPI> {

	_v1: ApiDefCaller<ApiStruct_PermissionAPI>['_v1'];

	constructor() {
		super(DBDef_PermissionAPI, dispatch_onPermissionAPIChanged);
		this._v1 = {};
	}
}

export const ModuleFE_PermissionAPI = new ModuleFE_PermissionAPI_Class();

