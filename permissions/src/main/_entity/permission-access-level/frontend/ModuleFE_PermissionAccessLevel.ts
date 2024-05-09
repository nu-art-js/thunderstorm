import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiStruct_PermissionAccessLevel, DBDef_PermissionAccessLevel, DBProto_PermissionAccessLevel} from '../shared';


export type DispatcherType_PermissionAccessLevel = DispatcherDef<DBProto_PermissionAccessLevel, `__onPermissionAccessLevelUpdated`>;

export const dispatch_onPermissionAccessLevelChanged = new ThunderDispatcherV3<DispatcherType_PermissionAccessLevel>('__onPermissionAccessLevelUpdated');

export class ModuleFE_PermissionAccessLevel_Class
	extends ModuleFE_BaseApi<DBProto_PermissionAccessLevel>
	implements ApiDefCaller<ApiStruct_PermissionAccessLevel> {

	_v1: ApiDefCaller<ApiStruct_PermissionAccessLevel>['_v1'];

	constructor() {
		super(DBDef_PermissionAccessLevel, dispatch_onPermissionAccessLevelChanged);
		this._v1 = {};
	}

}

export const ModuleFE_PermissionAccessLevel = new ModuleFE_PermissionAccessLevel_Class();

