import {Module} from '@nu-art/ts-common';
import {apiWithBody} from '@nu-art/thunderstorm/frontend';
import {ApiDef_OpenAI, ApiStruct_OpenAI} from '../../shared/api-def';
import {ApiDefCaller} from '@nu-art/thunderstorm';


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
