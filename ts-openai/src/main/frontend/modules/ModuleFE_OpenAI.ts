import {Module} from '@thunder-storm/common';
import {apiWithBody} from '@thunder-storm/core/frontend';
import {ApiDef_OpenAI, ApiStruct_OpenAI} from '../../shared/api-def';
import {ApiDefCaller} from '@thunder-storm/core';


type Config = {
// config here
}

export class ModuleFE_OpenAI_Class
	extends Module<Config> {

	readonly v1: ApiDefCaller<ApiStruct_OpenAI>['v1'];

	constructor() {
		super();

		this.v1 = {
			test: apiWithBody(ApiDef_OpenAI.v1.test),
		};
	}

	init() {
	}
}

export const ModuleFE_OpenAI = new ModuleFE_OpenAI_Class();
