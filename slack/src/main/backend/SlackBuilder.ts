import {Stream} from 'stream';
import {asArray, filterInstances, Logger} from '@nu-art/ts-common';
import {Block, KnownBlock} from '@slack/web-api';
import {ModuleBE_Slack, ThreadPointer} from './ModuleBE_Slack';

export type SlackFile = {
	file: Buffer | Stream;
	fileName: string;
	title?: string;
}

export type SlackBlock = Block | KnownBlock;

export class SlackBuilder
	extends Logger {

	private images: SlackFile[] = [];
	private blocks: SlackBlock[] = [];
	private replies: SlackBlock[][] = [];
	private readonly channel?: string;

	// ######################## Builder Steps ########################

	constructor(channel?: string) {
		super('SlackBuilder');
		this.channel = channel;
	}

	addImages = (images: SlackFile | SlackFile[]) => {
		asArray(images).forEach(image => this.images.push(image));
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
		const imageBlocks = await this.sendFiles();
		const messageResponse = await this.sendMessage(imageBlocks);
		await this.sendReplies(messageResponse!);
	};

	// ######################## Internal Logic ########################

	private sendFiles = async () => {
		this.logInfo('Sending Files');
		const results = await Promise.all(this.images.map(async image => {
			let tp: ThreadPointer | undefined;

			if (this.channel)
				tp = {channel: this.channel};

			const response = await ModuleBE_Slack.postFile(image.file, image.fileName, tp);
			if (!response.ok)
				return this.logError(response.error);

			return {
				type: 'image',
				// @ts-ignore
				image_url: response.file.permalink,
			} as SlackBlock;
		}));
		return filterInstances(results);
	};

	private sendMessage = async (fileBlocks: SlackBlock[]) => {
		this.logInfo('Sending Message');
		return ModuleBE_Slack.postStructuredMessage({
			channel: this.channel,
			blocks: [...this.blocks, ...fileBlocks],
			unfurl_links: true,
			unfurl_media: true
		});
	};

	private sendReplies = async (tp: ThreadPointer) => {
		this.logInfo('Sending Replies');
		for (const reply of this.replies) {
			await ModuleBE_Slack.postStructuredMessage({
				blocks: reply
			}, tp);
		}
	};
}