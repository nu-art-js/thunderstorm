import {__stringify, BadImplementationException, Module, ThisShouldNotHappenException, TypedMap} from '@thunder-storm/common';

import {OpenAI} from 'openai';
import {addRoutes, createBodyServerApi} from '@thunder-storm/core/backend';
import {ApiDef_OpenAI, Request_ChatGPT} from '../../shared/api-def';


type GPT_Model = 'gpt-4'
	| 'gpt-4-0314'
	| 'gpt-4-0613'
	| 'gpt-4-32k'
	| 'gpt-4-32k-0314'
	| 'gpt-4-32k-0613'
	| 'gpt-3.5-turbo'
	| 'gpt-3.5-turbo-16k'
	| 'gpt-3.5-turbo-0301'
	| 'gpt-3.5-turbo-0613'
	| 'gpt-3.5-turbo-16k-0613'

type Config = {
	directives: TypedMap<{
		agent?: GPT_Model,
		directive: string
	}>
	defaultModel: GPT_Model
	apiKey: string
	orgId?: string
// config here
}

// const config: Config = {
// 	directives: {
// 		'address-resolver': 'You are a Typescript address resolving assistant, you return a JSON with the following props: city, streetName, houseNumber, entrance (single letter), floor, apartmentNumber, country and additionalInfo. The JSON props must remain in english whereas the values need to be translated to valid addresses in Hebrew. unavailable props should be omitted from the JSON\'s props',
// 	},
// 	defaultModel: 'gpt-4',
// 	apiKey: 'YourAPI-Key',
// 	orgId: 'YourORG-Id'
// };
type Request_PredefiedDirective = {
	directiveKey: string,
	message: string
	model?: GPT_Model
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
		this.logInfo(opts);
		this.openai = new OpenAI(opts);

		addRoutes([
			createBodyServerApi(ApiDef_OpenAI.v1.test, this.test),
		]);
	}

	test = async (query: Request_ChatGPT) => this.simpleQuery(query);

	predefinedQuery = async (query: Request_PredefiedDirective) => {
		const directive = this.config.directives[query.directiveKey];
		if (!directive)
			throw new BadImplementationException(`Missing instruction for directive: ${query.directiveKey}`);

		return this.simpleQuery({model: directive.agent ?? query.model, message: query.message, directive: directive.directive});
	};

	simpleQuery = async (query: Request_ChatGPT) => {
		const completion = await this.openai.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: query.directive
				},
				{
					role: 'user',
					content: query.message
				}
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

