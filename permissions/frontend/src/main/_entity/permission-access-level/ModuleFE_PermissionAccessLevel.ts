import {ModuleFE_BaseApi} from '@nu-art/thunder-db-api-frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm-shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunder-db-api-frontend';
import {ApiStruct_PermissionAccessLevel, DBDef_PermissionAccessLevel, DBProto_PermissionAccessLevel} from '@nu-art/permissions-shared';


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

