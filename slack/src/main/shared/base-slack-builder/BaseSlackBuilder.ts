import {asArray, BadImplementationException, CustomException, Logger, ServerErrorSeverity} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {SlackBlock, SlackFile, ThreadPointer} from './types';


/**
 * Base class with logic for composing slack message, will use as base for making FE and BE versions
 * For better slack error reporting application wide
 */
export abstract class BaseSlackBuilder
	extends Logger {

	protected files: SlackFile[] = [];
	protected blocks: SlackBlock[] = [];
	protected replies: SlackBlock[][] = [];
	protected text: string = 'Monitor Message'; //default value, need to double-check that;
	protected channel: string;

	protected constructor(channel?: string) {
		super('BaseSlackBuilder');

		// if module provided config is not of default slack channel
		if (!channel) {
			throw new BadImplementationException('cannot create slack builder instance without channel provided');
		}

		this.channel = channel;
	}

	// ######################## Static Templates ########################

	/** Static template function
	 * For error reporting get slack emoji unicode for each severity level
	 * @param severity Severity level from the severity enum
	 */
	static SeverityEmoji = (severity: ServerErrorSeverity) => {
		switch (severity) {
			case ServerErrorSeverity.Critical:
				return ':red_circle:';
			case ServerErrorSeverity.Error:
				return ':large_orange_circle:';
			case ServerErrorSeverity.Warning:
				return ':large_yellow_circle:';
			case ServerErrorSeverity.Info:
				return ':large_purple_circle:';
			case ServerErrorSeverity.Debug:
				return ':large_blue_circle:';
		}
	};

	/** Static template function
	 * Generate slack message block containing a title and a text body
	 * @param title String to be printed as block title. can include any markdown accepted by slack and emoji uni-codes
	 * @param text String to be printed as block body. can include any markdown accepted by slack and emoji uni-codes
	 */
	static TextSectionWithTitle = (title: string, text: string): SlackBlock[] => {
		return [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: title
				}
			},
			{
				type: 'divider'
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: text
				}
			},
		];
	};

	/** Static template function
	 * Return a slack message block that renders a divider (line that separates parts of the message)
	 */
	static Divider = (): SlackBlock => {
		return {
			type: 'divider'
		};
	};

	/** Static template function
	 * Returns a slack message block of a paragraph, accepts all slack markdown and uni-codes
	 * @param text The block text to render
	 */
	static TextSection = (text: string): SlackBlock => {
		return {
			type: 'section',
			text: {
				// @ts-ignore
				type: 'mrkdwn',
				text: text,
			}
		};
	};

	/** Static template function
	 * Exception notification text, used to resolve header text from TS custom exceptions
	 * @param exception The custom exception to resolve title from
	 */
	static ExceptionNotificationText = (exception: CustomException) => {
		return `*${exception.exceptionType}* - ${exception.message}`;
	};

	// ######################## Message builder logic ########################

	/**
	 * Add files to send in the slack message, accepts both single and multiple files at once
	 * @param files List or a single file to send
	 */
	addFiles = (files: SlackFile | SlackFile[]) => {
		asArray(files).forEach(image => this.files.push(image));
		return this;
	};

	/**
	 * Add new blocks to the slack message to send
	 * @param blocks List or a single block to add to the message
	 */
	addBlocks = (blocks: SlackBlock | SlackBlock[]) => {
		asArray(blocks).forEach(block => this.blocks.push(block));
		return this;
	};

	/**
	 * Add reply to the message composed
	 * @param replyBlocks List or single reply to add to the message
	 */
	addReply = (replyBlocks: SlackBlock | SlackBlock[]) => {
		const reply: SlackBlock[] = [];
		asArray(replyBlocks).forEach(block => reply.push(block));
		this.replies.push(reply);
		return this;
	};

	/**
	 * Public send method, will handle the sending process to slack,
	 * First will send the message to the channel
	 * Then will send all files and replys in a thread of the original message
	 */
	send = async () => {
		const tp = await this.sendMessage();
		if (!tp)
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR(
				'Error while sending slack message',
				'Did not get thread pointer from sending slack message'
			);
		await this.sendFiles(tp);
		await this.sendReplies(tp);
	};

	// ######################## Abstract Logic Logic ########################
	/**
	 * Abstract function, implement according to needs in each class.
	 * This function will handle sending of the main message made out of blocks
	 */
	protected abstract sendMessage: () => Promise<ThreadPointer | undefined>;

	/**
	 * Abstract function, implement according to needs in each class.
	 * This function will handle sending files to slack in a thread of the original message
	 */
	protected abstract sendFiles: (tp: ThreadPointer) => Promise<void>;

	/**
	 * Abstract function, implement according to needs in each class.
	 * This function will handle sending all replys in the thread of the original message
	 */
	protected abstract sendReplies: (tp: ThreadPointer) => Promise<void>;
}