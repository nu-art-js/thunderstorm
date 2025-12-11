import {ApiDef_Analytics, ApiStruct_Analytics} from '@nu-art/analytics-shared';
import {apiWithBody} from '@nu-art/thunderstorm-frontend/index';
import {ApiDefCaller} from '@nu-art/thunderstorm-shared';
import {Module} from '@nu-art/ts-common';

type Config = {
	baseURL: string;
};

class ModuleFE_Analytics_Class
	extends Module<Config> {

	readonly _v1: ApiDefCaller<ApiStruct_Analytics>['_v1'] = {} as ApiDefCaller<ApiStruct_Analytics>['_v1'];

	init() {
		const apiDef = ApiDef_Analytics(this.config.baseURL);
		this._v1.sendEvent = apiWithBody(apiDef._v1.sendEvent);
		this._v1.updateUser = apiWithBody(apiDef._v1.updateUser);
		this._v1.updateLexicon = apiWithBody(apiDef._v1.updateLexicon);
	}
}

export const ModuleFE_Analytics = new ModuleFE_Analytics_Class();