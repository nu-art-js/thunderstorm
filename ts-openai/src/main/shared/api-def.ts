import {ApiDefResolver, BodyApi, HttpMethod} from '@thunder-storm/core';
import {Minute} from '@thunder-storm/common';
import {GPT_Model} from './types';


export type Request_ChatGPT = {
	directive: string,
	message: string
	model?: GPT_Model
};

export type ApiStruct_OpenAI = {
	v1: {
		test: BodyApi<{ response: string }, Request_ChatGPT>;
	}
}

export const ApiDef_OpenAI: ApiDefResolver<ApiStruct_OpenAI> = {
	v1: {
		test: {method: HttpMethod.POST, path: 'v1/open-ai/test', timeout: Minute},
	}
};