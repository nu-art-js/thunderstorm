import {Module, tsValidate, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import {OpenAI} from 'openai';
import {OpenAIClient_Assistant_Class} from './clients/OpenAIClient_Assistant.js';
import {OpenAIClient_Chat_Class} from './clients/OpenAIClient_Chat.js';
import {GPT_Model} from '@nu-art/ts-openai-shared/types';

type Config = {
	apiKey: string,
	orgId: string,
	openAIModel: GPT_Model
}

class ModuleBE_OpenAIV2_Class
	extends Module<Config> {
	private OpenAIClient!: OpenAI;

	constructor() {
		super();

		// set the config validator in the base module
		this.setConfigValidator({
			apiKey: tsValidateString(),
			orgId: tsValidateString(),
			openAIModel: tsValidateValue([...GPT_Model]),
		});
	}

	protected init() {
		super.init();

		try {
			// validate the config - The config is being set in the constructor so I can assume it exists
			tsValidate(this.config, this.configValidator!);

			// create the basic OpenAI client
			this.OpenAIClient = new OpenAI({
				apiKey: this.config.apiKey,
				organization: this.config.orgId
			});
		} catch (err: any) {
			this.logError('Failed initializing modules', err);
		}
	}

	public getAssistant = (assistantConfig: OpenAI.Beta.Assistants.AssistantCreateParams) => {
		return OpenAIClient_Assistant_Class.createInstance(this.OpenAIClient, assistantConfig);
	};

	public getChatClient = () => {
		return new OpenAIClient_Chat_Class(this.OpenAIClient, this.config.openAIModel ?? 'gpt-3.5-turbo');
	};

}


export const ModuleBE_OpenAIV2 = new ModuleBE_OpenAIV2_Class();