import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiStruct_PermissionGroup, DBDef_PermissionGroup, DBProto_PermissionGroup} from '../shared';

export type DispatcherType_PermissionGroup = DispatcherDef<DBProto_PermissionGroup, `__onPermissionGroupUpdated`>;

export const dispatch_onPermissionGroupChanged = new ThunderDispatcherV3<DispatcherType_PermissionGroup>('__onPermissionGroupUpdated');

export class ModuleFE_PermissionGroup_Class
	extends ModuleFE_BaseApi<DBProto_PermissionGroup>
	implements ApiDefCaller<ApiStruct_PermissionGroup> {

	_v1: ApiDefCaller<ApiStruct_PermissionGroup>['_v1'];

	constructor() {
		super(DBDef_PermissionGroup, dispatch_onPermissionGroupChanged);
		this._v1 = {};
	}
}

export const ModuleFE_PermissionGroup = new ModuleFE_PermissionGroup_Class();

