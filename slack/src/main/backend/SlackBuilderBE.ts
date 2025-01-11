import {ModuleBE_Slack, ThreadPointer} from './ModuleBE_Slack';
import {BaseSlackBuilder, SlackBlock} from '../shared';
import {__stringify, currentTimeMillis, formatTimestamp, generateHex} from '@nu-art/ts-common';

export class SlackBuilderBE
	extends BaseSlackBuilder {

	// ######################## Builder Steps ########################

	constructor(channel?: string, blocks?: SlackBlock[], replies?: SlackBlock[][]) {
		super(channel, blocks, replies);
	}

	// ######################## Internal Logic ########################

	private convertLongSectionBlocks = () => {
		const convertBlock = (block: SlackBlock) => {
			if (block.type !== 'section')
				return;

			//@ts-ignore - text does exist on the block at this point
			const text = block.text.text;
			if (text.length < 3000)
				return;

			//Convert the text into a file
			const fileName = `${formatTimestamp('DD/MM/YYYY_HH:mm', currentTimeMillis())}_${generateHex(8)}`;
			const buffer = Buffer.from(__stringify(text, true), 'utf-8');
			this.addFiles({
				title: fileName,
				fileName: fileName,
				file: buffer
			});

			// @ts-ignore
			block.text.text = `Message was too long, converted to file "${fileName}"`;
		};
		this.blocks.forEach(convertBlock);
		this.replies.forEach(reply => reply.forEach(convertBlock));
	};

	protected sendMessage = async () => {
		this.convertLongSectionBlocks();
		return ModuleBE_Slack.postStructuredMessage({
			channel: this.channel,
			blocks: this.blocks,
		});
	};

	protected sendFiles = async (tp: ThreadPointer) => {
		await Promise.all(this.files.map(async file => {
			const response = await ModuleBE_Slack.postFile(file.file, file.fileName, tp);
			if (!response.ok)
				return this.logError(response.error);
		}));
	};

	protected sendReplies = async (tp: ThreadPointer) => {
		for (const reply of this.replies) {
			await ModuleBE_Slack.postStructuredMessage({
				blocks: reply
			}, tp);
		}
	};
}