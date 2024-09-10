import {ApiStruct_LoginAttempt, DBDef_LoginAttempt, DBProto_LoginAttempt} from '../shared';
import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';


export type DispatcherType_LoginAttempt = DispatcherDef<DBProto_LoginAttempt, `__onLoginAttemptsUpdated`>;

export const dispatch_onLoginAttemptsUpdated = new ThunderDispatcherV3<DispatcherType_LoginAttempt>('__onLoginAttemptsUpdated');

export class ModuleFE_LoginAttempt_Class
	extends ModuleFE_BaseApi<DBProto_LoginAttempt>
	implements ApiDefCaller<ApiStruct_LoginAttempt> {

	_v1: ApiDefCaller<ApiStruct_LoginAttempt>['_v1'];

	constructor() {
		super(DBDef_LoginAttempt, dispatch_onLoginAttemptsUpdated);
		this._v1 = {};
	}

}

export const ModuleFE_LoginAttempt = new ModuleFE_LoginAttempt_Class();

