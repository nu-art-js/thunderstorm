import {ImplementationMissingException, lastElement, Module} from '@nu-art/ts-common';
import {
	ChatCompletionAssistantMessageParam,
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionDeveloperMessageParam,
	ChatCompletionSystemMessageParam,
	ChatCompletionToolMessageParam,
	ChatCompletionUserMessageParam
} from 'openai/resources';
import {OpenAI} from 'openai';
import {ModuleBE_AgentTools} from '@nu-art/ts-agent-tools-backend';

type AgentInputMessage = ChatCompletionSystemMessageParam
	| ChatCompletionUserMessageParam
	| ChatCompletionDeveloperMessageParam;

type AgentMessage = | AgentInputMessage
	| ChatCompletionAssistantMessageParam
	| ChatCompletionToolMessageParam

type Config = {
	openaiApiKey: string;
	maxChatMessages: number;
};

type Prompt = {
	messages: { role: AgentInputMessage['role'], content: string }[],
	agent: string,
	tools?: string[],
}
export type PromptResponse = {
	message: string;
	conversationId?: string;
	toolsUsed?: {
		toolName: string;
		arguments: any;
		result: any;
	}[];
}

export class ModuleBE_OpenAIMCP_Class
	extends Module<Config> {

	private client!: OpenAI;

	constructor() {
		super();
		this.setDefaultConfig({maxChatMessages: 10});
	}

	protected init(): void {
		if (!this.config.openaiApiKey)
			throw new ImplementationMissingException('Missing \'openaiApiKey\' in config. Please provide a valid OpenAI API key.');

		this.client = new OpenAI({apiKey: this.config.openaiApiKey});
	}

	public chat = async (prompts: Prompt[]): Promise<PromptResponse> => {
		let messages: AgentMessage[] = [];
		for (const prompt of prompts) {
			messages.push(...prompt.messages);

			const toolsInput = ModuleBE_AgentTools.getTools(prompt.tools)?.map(tool => ({
				type: 'function' as const,
				function: {
					name: tool.name,
					parameters: tool.inputSchema
				}
			}));

			const request: ChatCompletionCreateParamsNonStreaming = {
				model: prompt.agent,
				messages,
				tools: toolsInput?.length ? toolsInput : undefined,
			};

			this.logVerbose('Prompt: ', prompt);
			const completion = await this.client.chat.completions.create(request);
			const choice = completion.choices[0];
			let assistantMessage = choice.message;
			this.logVerbose('Response: ', assistantMessage);

			messages.push(assistantMessage);

			while (assistantMessage.tool_calls && messages.length < this.config.maxChatMessages) {
				const toolCallsResponses = await Promise.all(assistantMessage.tool_calls.map(async toolCall => {
						let toolName: string;
						let args: any;
						if (toolCall.type === 'function') {
							toolName = toolCall.function.name;
							args = JSON.parse(toolCall.function.arguments);
						} else
							toolName = toolCall.custom.name;

						const result = await ModuleBE_AgentTools.getTool(toolName)?.execute(args);
						return {
							id: toolCall.id,
							toolName,
							arguments: args,
							result: {result}
						};
					})
				);

				messages.push(...toolCallsResponses.map(result => ({
					role: 'tool' as const,
					tool_call_id: result.id,
					content: JSON.stringify(result.result)
				})));

				const finalCompletion = await this.client.chat.completions.create({
					model: prompt.agent,
					messages
				});
				const choice = finalCompletion.choices[0];
				assistantMessage = choice.message;
			}
			messages.push(assistantMessage);
		}

		const message = (lastElement(messages) as ChatCompletionAssistantMessageParam).content as string;
		return {message};
	};
}

export const ModuleBE_OpenAIMCP = new ModuleBE_OpenAIMCP_Class();

