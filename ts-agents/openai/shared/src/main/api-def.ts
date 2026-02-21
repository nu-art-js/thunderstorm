import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {Minute} from '@nu-art/ts-common';
import {GPT_Model} from './types.js';

export type Request_ChatGPT = {
	directive: string;
	message: string;
	model?: GPT_Model;
};

export type Response_ChatGPT_Test = { response: string };

export type API_OpenAI = {
	test: BodyApi<Response_ChatGPT_Test, Request_ChatGPT>;
};

export const ApiDef_OpenAI: ApiDefResolver<API_OpenAI> = {
	test: {method: HttpMethod.POST, path: 'v1/open-ai/test', timeout: Minute},
};
