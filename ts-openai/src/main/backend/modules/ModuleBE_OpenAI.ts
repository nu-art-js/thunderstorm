import {__stringify, BadImplementationException, Module, ThisShouldNotHappenException, TypedMap} from '@nu-art/ts-common';

import {OpenAI} from 'openai';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
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
	directives: TypedMap<string>
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
			createBodyServerApi(ApiDef_OpenAI.v1.test, this.simpleQuery),
		]);
	}

	simpleQuery = async (query: Request_ChatGPT) => {
		const systemDirective = this.config.directives[query.directive];
		if (!systemDirective)
			throw new BadImplementationException(`Missing instruction for directive: ${query.directive}`);

		const completion = await this.openai.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: systemDirective
				},
				{
					role: 'user',
					content: query.message
				}
			],
			model: query.model || this.config.defaultModel || 'gpt-3.5-turbo',
		});

		console.log(completion);
		const content = completion.choices[0].message.content;
		if (!content)
			throw new ThisShouldNotHappenException(`Didn't receive a response from GPT, got: ${__stringify(completion, true)}`);

		return {response: content};
	};
}

export const ModuleBE_OpenAI = new ModuleBE_OpenAI_Class();

