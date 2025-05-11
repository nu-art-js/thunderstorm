import {expect} from 'chai';
import sinon, {SinonStub} from 'sinon';
import {OpenAI} from 'openai';
import {OpenAIClient_Chat_Class} from '../clients/OpenAIClient_Chat';
import {BadImplementationException, ThisShouldNotHappenException} from '@nu-art/ts-common';

describe('OpenAIClient_Chat_Class', () => {
    let openAIClient: sinon.SinonStubbedInstance<OpenAI>;
    let chatClient: OpenAIClient_Chat_Class;

    const defaultModel = 'gpt-3.5-turbo';

    beforeEach(() => {
        openAIClient = sinon.createStubInstance(OpenAI);
        // Deep stub chat.completions.create
        (openAIClient.chat as any) = {
            completions: {
                create: sinon.stub()
            }
        };

        chatClient = new OpenAIClient_Chat_Class(openAIClient, defaultModel);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should send a basic message and return the response', async () => {
        const mockResponse = {
            choices: [{ message: { content: 'Hello back!' } }]
        };

        (openAIClient.chat.completions.create as SinonStub).resolves(mockResponse);

        const result = await chatClient.query({
            message: 'Hello?'
        });

        expect(result).to.deep.equal({ response: 'Hello back!' });
        expect((openAIClient.chat.completions.create as SinonStub).calledOnce).to.be.true;
    });

    it('should send a message with a directive', async () => {
        const mockResponse = {
            choices: [{ message: { content: 'System directive respected.' } }]
        };

        (openAIClient.chat.completions.create as SinonStub).resolves(mockResponse);

        const result = await chatClient.query({
            message: 'Test this',
            directive: 'You are a polite assistant.'
        });

        const callArgs = (openAIClient.chat.completions.create as SinonStub).firstCall.args[0];

        expect(callArgs.messages[0].role).to.equal('system');
        expect(callArgs.messages[0].content).to.equal('You are a polite assistant.');
        expect(result).to.deep.equal({ response: 'System directive respected.' });
    });

    it('should use a custom model if provided', async () => {
        const customModel = 'gpt-4';
        const mockResponse = {
            choices: [{ message: { content: 'From GPT-4' } }]
        };

        (openAIClient.chat.completions.create as SinonStub).resolves(mockResponse);

        await chatClient.query({
            message: 'Use different model',
            model: customModel
        });

        const callArgs = (openAIClient.chat.completions.create as SinonStub).firstCall.args[0];
        expect(callArgs.model).to.equal(customModel);
    });

    it('should throw if message is missing', async () => {
        try {
            await chatClient.query({ message: '' } as any);
            throw new Error('Did not throw');
        } catch (err: any) {
            expect(err).to.be.instanceOf(BadImplementationException);
        }
    });

    it('should throw if response has no content', async () => {
        (openAIClient.chat.completions.create as SinonStub).resolves({ choices: [{}] });

        try {
            await chatClient.query({ message: 'No content expected' });
            throw new Error('Did not throw');
        } catch (err: any) {
            expect(err).to.be.instanceOf(ThisShouldNotHappenException);
        }
    });
});