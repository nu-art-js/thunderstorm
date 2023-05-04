import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody} from '@nu-art/thunderstorm/frontend';
import {Module} from '@nu-art/ts-common';
import {ApiDef_SyncEnv, ApiStruct_SyncEnv} from '../shared';

class ModuleFE_SyncEnv_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_SyncEnv>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			fetchFromEnv: apiWithBody(ApiDef_SyncEnv.vv1.fetchFromEnv),
		};
	}
}

export const ModuleFE_SyncEnv = new ModuleFE_SyncEnv_Class();