import {expect} from 'chai';
import {OpenAIClient_Assistant_Class} from '../clients/OpenAIClient_Assistant.js';
import {OpenAI} from 'openai';
import sinon, {SinonStub} from 'sinon';
import {BlobLike, Uploadable} from 'openai/uploads';

describe('OpenAIClient_Assistant_Class', () => {
    let openAIClient: sinon.SinonStubbedInstance<OpenAI>;
    let assistantInstance: OpenAIClient_Assistant_Class;

    beforeEach(async () => {
        // Mock OpenAI client
        openAIClient = sinon.createStubInstance(OpenAI);

        // Manually define nested structure
        openAIClient.beta = {
            assistants: {
                create: sinon.stub().resolves({id: 'mock-assistant-id'}),
                update: sinon.stub(),
                del: sinon.stub(),
                retrieve: sinon.stub()
            },
            threads: {
                create: sinon.stub().resolves({id: 'mock-thread-id'}),
                messages: {
                    create: sinon.stub(),
                    list: sinon.stub()
                },
                runs: {
                    create: sinon.stub().resolves({id: 'mock-run-id', status: 'completed'}),
                    retrieve: sinon.stub()
                }
            }
        } as any;

        openAIClient.files = {
            create: sinon.stub()
        } as any;

        // Create an instance of the class
        assistantInstance = await OpenAIClient_Assistant_Class.createInstance(openAIClient, {
            name: 'Test Assistant',
            description: 'A test assistant',
            model: 'gpt-3.5-turbo',
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should upload a file successfully', async () => {
        const mockFile: Uploadable = {
            name: 'mock.txt',
            size: 20,
            type: 'text/plain',
            text(): Promise<string> {
                return Promise.resolve('mock content');
            },
            lastModified: Date.now(),
            slice(start?: number, end?: number): BlobLike {
                return this as any
            }
        };
        const mockPurpose = 'fine-tune';

        (openAIClient.files.create as SinonStub).resolves({id: 'mock-file-id'});

        const result = await assistantInstance.uploadFile(mockFile, mockPurpose);

        expect(result).to.have.property('id', 'mock-file-id');
        expect((openAIClient.files.create as SinonStub).calledOnce).to.be.true;
    });

    it('should create a message successfully', async () => {
        const mockThread = {id: 'mock-thread-id'};
        const mockPrompt = 'Test prompt';
        const mockAttachments: any[] = [];

        (openAIClient.beta.threads.create as SinonStub).resolves(mockThread);
        (openAIClient.beta.threads.messages.create as SinonStub).resolves();

        const result = await assistantInstance.createMessage(mockPrompt, mockAttachments);

        expect(result).to.have.property('threadId', 'mock-thread-id');
        expect((openAIClient.beta.threads.create as SinonStub).calledOnce).to.be.true;
        expect((openAIClient.beta.threads.messages.create as SinonStub).calledOnce).to.be.true;
    });

    it('should run the assistant on a thread successfully', async () => {
        const mockThreadId = 'mock-thread-id';
        const mockRun = {id: 'mock-run-id', status: 'completed'};
        const mockMessage = {content: 'Assistant response'};

        (openAIClient.beta.threads.runs.create as SinonStub).returns(mockRun);
        (openAIClient.beta.threads.runs.retrieve as SinonStub).resolves(mockRun);
        (openAIClient.beta.threads.messages.list as SinonStub).resolves({data: [mockMessage]});

        const result = await assistantInstance.runAssistantOnThread(mockThreadId);

        expect(result).to.deep.equal(mockMessage);
        expect((openAIClient.beta.threads.runs.create as SinonStub).calledOnce).to.be.true;
        expect((openAIClient.beta.threads.runs.retrieve as SinonStub).called).to.be.true;
        expect((openAIClient.beta.threads.messages.list as SinonStub).calledOnce).to.be.true;
    });

    it('should create a message and run the assistant successfully', async () => {
        const mockThreadId = 'mock-thread-id';
        const mockRun = {id: 'mock-run-id', status: 'completed'};
        const mockMessage = {content: 'Assistant response'};
        const mockPrompt = 'Test prompt';
        const mockAttachments: any[] = [];

        (openAIClient.beta.threads.create as SinonStub).resolves({id: mockThreadId});
        (openAIClient.beta.threads.messages.create as SinonStub).resolves();
        (openAIClient.beta.threads.runs.create as SinonStub).resolves(mockRun);
        (openAIClient.beta.threads.runs.retrieve as SinonStub).resolves(mockRun);
        (openAIClient.beta.threads.messages.list as SinonStub).resolves({data: [mockMessage]});

        const result = await assistantInstance.createMessageAndRun(mockPrompt, mockAttachments);

        expect(result).to.deep.equal(mockMessage);
        expect((openAIClient.beta.threads.create as SinonStub).calledOnce).to.be.true;
        expect((openAIClient.beta.threads.messages.create as SinonStub).calledOnce).to.be.true;
        expect((openAIClient.beta.threads.runs.create as SinonStub).calledOnce).to.be.true;
        expect((openAIClient.beta.threads.messages.list as SinonStub).calledOnce).to.be.true;
    });

    it('should fetch assistant details successfully', async () => {
        const mockAssistantDetails = {id: 'mock-assistant-id'};

        (openAIClient.beta.assistants.retrieve as SinonStub).resolves(mockAssistantDetails);

        const result = assistantInstance.assistantUtils.getAssistant();

        expect(result).to.deep.equal(mockAssistantDetails);
        expect((openAIClient.beta.assistants.retrieve as SinonStub).calledOnce).to.be.false; // `getAssistant` uses `structuredClone`
    });
});