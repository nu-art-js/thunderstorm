import {Stream} from 'stream';
import {asArray, Logger} from '@nu-art/ts-common';
import {Block, KnownBlock} from '@slack/web-api';
import {ModuleBE_Slack, ThreadPointer} from './ModuleBE_Slack';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';

export type SlackFile = {
	file: Buffer | Stream;
	fileName: string;
	title?: string;
}

export type SlackBlock = Block | KnownBlock;

export class SlackBuilder
	extends Logger {

	private files: SlackFile[] = [];
	private blocks: SlackBlock[] = [];
	private replies: SlackBlock[][] = [];
	private readonly channel?: string;

	// ######################## Builder Steps ########################

	constructor(channel?: string) {
		super('SlackBuilder');
		this.channel = channel;
	}

	addFiles = (files: SlackFile | SlackFile[]) => {
		asArray(files).forEach(image => this.files.push(image));
		return this;
	};

	addBlocks = (blocks: SlackBlock | SlackBlock[]) => {
		asArray(blocks).forEach(block => this.blocks.push(block));
		return this;
	};

	addReply = (replyBlocks: SlackBlock | SlackBlock[]) => {
		const reply: SlackBlock[] = [];
		asArray(replyBlocks).forEach(block => reply.push(block));
		this.replies.push(reply);
		return this;
	};

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

	// ######################## Internal Logic ########################

	private sendMessage = async () => {
		return ModuleBE_Slack.postStructuredMessage({
			channel: this.channel,
			blocks: this.blocks,
		});
	};

	private sendFiles = async (tp: ThreadPointer) => {
		await Promise.all(this.files.map(async file => {
			const response = await ModuleBE_Slack.postFile(file.file, file.fileName, tp);
			if (!response.ok)
				return this.logError(response.error);
		}));
	};

	private sendReplies = async (tp: ThreadPointer) => {
		for (const reply of this.replies) {
			await ModuleBE_Slack.postStructuredMessage({
				blocks: reply
			}, tp);
		}
	};
}