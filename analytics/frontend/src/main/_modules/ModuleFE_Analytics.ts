import {ApiDef_Analytics, ApiStruct_Analytics} from '@nu-art/analytics-shared';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody} from '@nu-art/thunderstorm/frontend';
import {Module} from '@nu-art/ts-common';

class ModuleFE_Analytics_Class
	extends Module {

	readonly _v1: ApiDefCaller<ApiStruct_Analytics>['_v1'];

	constructor() {
		super();
		this._v1 = {
			sendEvent: apiWithBody(ApiDef_Analytics._v1.sendEvent),
		};
	}
}

export const ModuleFE_Analytics = new ModuleFE_Analytics_Class();