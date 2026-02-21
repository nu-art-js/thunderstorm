import {__stringify, BadImplementationException, Module, ThisShouldNotHappenException, TypedMap} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {OpenAI} from 'openai';
import {GPT_Model} from '@nu-art/ts-openai-shared/types';
import {API_OpenAI, ApiDef_OpenAI, Request_ChatGPT} from '@nu-art/ts-openai-shared/api-def';

type Config = {
	directives: TypedMap<{
		agent?: GPT_Model;
		directive: string;
	}>;
	defaultModel: GPT_Model;
	apiKey: string;
	orgId?: string;
};

export type Request_PredefinedDirective = {
	directiveKey: string;
	message: string;
	model?: GPT_Model;
};

export class ModuleBE_OpenAI_Class
	extends Module<Config> {

	private openai!: OpenAI;

	constructor(tag?: string) {
		super(tag);
	}

	init() {
		const apiKey = this.config.apiKey;
		const organization = this.config.orgId;
		const opts = {apiKey, organization};
		this.logDebug(opts);
		this.openai = new OpenAI(opts);
	}

	@ApiHandler(ApiDef_OpenAI.test)
	async test(body: Request_ChatGPT): Promise<API_OpenAI['test']['Response']> {
		return this.simpleQuery(body);
	}

	predefinedQuery = async (query: Request_PredefinedDirective) => {
		const directive = this.config.directives[query.directiveKey];
		if (!directive)
			throw new BadImplementationException(`Missing instruction for directive: ${query.directiveKey}`);

		return this.simpleQuery({model: directive.agent ?? query.model, message: query.message, directive: directive.directive});
	};

	simpleQuery = async (query: Request_ChatGPT): Promise<{ response: string }> => {
		const completion = await this.openai.chat.completions.create({
			messages: [
				{role: 'system', content: query.directive},
				{role: 'user', content: query.message}
			],
			model: query.model || this.config.defaultModel || 'gpt-3.5-turbo',
		});

		const content = completion.choices[0].message.content;
		this.logInfo(completion);
		if (!content)
			throw new ThisShouldNotHappenException(`Didn't receive a response from GPT, got: ${__stringify(completion, true)}`);

		return {response: content};
	};
}

export const ModuleBE_OpenAI = new ModuleBE_OpenAI_Class();
