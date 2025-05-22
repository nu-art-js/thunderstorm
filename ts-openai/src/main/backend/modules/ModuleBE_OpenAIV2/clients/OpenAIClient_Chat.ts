import {__stringify, BadImplementationException, Module, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {OpenAI} from 'openai';
import {GPT_Model} from "../../../../shared/types";
import {ChatCompletionMessageParam} from "openai/src/resources/chat/completions/completions";

type Request_Query = {
    message: string;
    model?: GPT_Model;
    directive?: string;
};

export class OpenAIClient_Chat_Class extends Module {
    private readonly client: OpenAI;
    private readonly defaultModel: GPT_Model;

    constructor(client: OpenAI, defaultModel: GPT_Model) {
        super();
        this.client = client;
        this.defaultModel = defaultModel;
    }

    public async query({message, model, directive}: Request_Query) {
        if (!message)
            throw new BadImplementationException('Missing message for query');

        const messages: ChatCompletionMessageParam[] = [
            ...(directive ? [{role: 'system' as const, content: directive!}] : []),
            {role: 'user' as const, content: message}
        ];

        const response = await this.client.chat.completions.create({
            model: model ?? this.defaultModel,
            messages: messages
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content)
            throw new ThisShouldNotHappenException(`Empty GPT response: ${__stringify(response, true)}`);

        return {response: content};
    }
}