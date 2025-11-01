import {Module, Second, UniqueId} from '@nu-art/ts-common';
import {OpenAI} from 'openai';
import {Uploadable} from 'openai/uploads';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


export class OpenAIClient_Assistant_Class
	extends Module {

	private client: OpenAI;
	private readonly assistant: OpenAI.Beta.Assistant;

	//###################### Static ######################

	static createInstance = async (client: OpenAI, config: OpenAI.Beta.Assistants.AssistantCreateParams): Promise<OpenAIClient_Assistant_Class> => {
		const assistant = await this.createAssistant(client, config);
		return new OpenAIClient_Assistant_Class(client, assistant);
	};

	/**
	 * Creates a new assistant with the given parameters.
	 * @param client - The OpenAI client to use for the request.
	 * @param params - The parameters for the assistant creation.
	 * @private
	 */
	private static async createAssistant(client: OpenAI, params: OpenAI.Beta.Assistants.AssistantCreateParams) {
		return client.beta.assistants.create(params);
	}

	//###################### LifeCycle ######################

	constructor(client: OpenAI, assistant: OpenAI.Beta.Assistants.Assistant) {
		super();

		this.client = client;
		this.assistant = assistant;
	}

	//###################### Files ######################

	/**
	 * Uploads a file to the OpenAI API
	 * @param fileReadStream - The file to upload - this should be a readable stream
	 * @param filePurpose - The purpose of the file - this should be one of the OpenAI.Files.FilePurpose enums
	 */
	public uploadFile = (fileReadStream: Uploadable, filePurpose: OpenAI.Files.FilePurpose) => {
		return this.client.files.create({
			file: fileReadStream,
			purpose: filePurpose
		});
	};

	//###################### Messages & Run ######################

	/**
	 * Creates a new message for the assistant to handle.
	 * @param prompt
	 * @param attachments
	 */
	public createMessage = async (prompt: string, attachments: OpenAI.Beta.Threads.MessageCreateParams.Attachment[]) => {
		try {
			const thread = await this.messageUtils.createThread();

			// create the message in the thread
			await this.client.beta.threads.messages.create(thread.id, {
				role: 'user',
				content: prompt,
				attachments: attachments
			});

			// return the thread id to run the message
			return {threadId: thread.id};
		} catch (err: any) {
			this.logError('Failed creating message', err);
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR;
		}
	};

	/**
	 * Run the assistant on the thread to get a proper response to the added message
	 * @param threadId - The thread id to run the assistant on
	 */
	public runAssistantOnThread = async (threadId: UniqueId) => {
		try {

			// create the run
			const run = await this.client.beta.threads.runs.create(threadId, {
				assistant_id: this.assistant.id
			});

			// poll the status of the run until it is completed
			await this.messageUtils.pollRunStatus(threadId, run.id);

			// return the latest message sent by the assistant in the thread
			return this.messageUtils.fetchRunResult(threadId);
		} catch (err: any) {
			this.logError('Failed running assistant on thread', err);
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR;
		}
	};

	/**
	 * Creates a new message for the assistant to handle and runs the assistant on the created thread.
	 * @param prompt - The prompt to send to the assistant.
	 * @param attachments - Attachments to include in the message.
	 * @returns The result of the assistant's response to the message.
	 */
	public createMessageAndRun = async (prompt: string, attachments: OpenAI.Beta.Threads.MessageCreateParams.Attachment[]) => {
		try {
			// Create a new message
			const {threadId} = await this.createMessage(prompt, attachments);

			// Run the assistant on the created thread
			return await this.runAssistantOnThread(threadId);
		} catch (err: any) {
			this.logError('Failed to create message and run assistant', err);
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR;
		}
	};

	//###################### Public Utils ######################

	/**
	 * Utility methods for managing the assistant.
	 * - `getAssistant`: Returns a deep copy of the current assistant instance.
	 * - `deleteAssistant`: Deletes an assistant by its unique ID.
	 * - `updateAssistant`: Updates an assistant's configuration using the provided parameters.
	 */
	public assistantUtils = {
		getAssistant: () => structuredClone(this.assistant),
		deleteAssistant: async (assistantId: UniqueId) => this.client.beta.assistants.delete(assistantId),
		updateAssistant: async (assistantId: UniqueId, params: OpenAI.Beta.Assistants.AssistantUpdateParams) => this.client.beta.assistants.update(assistantId, params)
	};

	//###################### Private Utils ######################

	/**
	 * A set of utils to help with the message creation process.
	 * @method createThread - Creates a new thread for the assistant to handle.
	 * @method pollRunStatus - Polls the status of a run until it is completed.
	 * @method fetchRunResult - Fetches the latest message sent by the assistant in the thread.
	 * @private
	 */
	private messageUtils = {
		createThread: () => this.client.beta.threads.create(),
		pollRunStatus: async (threadId: UniqueId, runId: UniqueId) => {
			let runStatus;
			do {
				await new Promise(resolve => setTimeout(resolve, Second));
				runStatus = await this.client.beta.threads.runs.retrieve(runId, {thread_id: threadId});
			} while (runStatus.status !== 'completed');
		},
		fetchRunResult: async (threadId: UniqueId) => {
			const messages = await this.client.beta.threads.messages.list(threadId);
			return messages.data[0];
		}
	};
}
