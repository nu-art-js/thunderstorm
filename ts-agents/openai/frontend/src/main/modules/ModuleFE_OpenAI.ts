import {Module} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {API_OpenAI, ApiDef_OpenAI, Request_ChatGPT} from '@nu-art/ts-openai-shared/api-def';

type Config = Record<string, never>;

export class ModuleFE_OpenAI_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	protected init() {
	}

	@ApiCaller(ApiDef_OpenAI.test)
	async test(body: Request_ChatGPT): Promise<API_OpenAI['test']['Response']> {
		void body;
		return undefined as unknown as API_OpenAI['test']['Response'];
	}
}

export const ModuleFE_OpenAI = new ModuleFE_OpenAI_Class();
