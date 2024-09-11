import {ApiStruct_FailedLoginAttempt, DBDef_FailedLoginAttempt, DBProto_FailedLoginAttempt} from '../shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';


export type DispatcherType_FailedLoginAttempt = DispatcherDef<DBProto_FailedLoginAttempt, `__onFailedLoginAttemptsUpdated`>;

export const dispatch_onFailedLoginAttemptsUpdated = new ThunderDispatcherV3<DispatcherType_FailedLoginAttempt>('__onFailedLoginAttemptsUpdated');

export class ModuleFE_FailedLoginAttempt_Class
	extends ModuleFE_BaseApi<DBProto_FailedLoginAttempt>
	implements ApiDefCaller<ApiStruct_FailedLoginAttempt> {

	_v1: ApiDefCaller<ApiStruct_FailedLoginAttempt>['_v1'];

	constructor() {
		super(DBDef_FailedLoginAttempt, dispatch_onFailedLoginAttemptsUpdated);
		this._v1 = {};
	}

}

export const ModuleFE_FailedLoginAttempt = new ModuleFE_FailedLoginAttempt_Class();

