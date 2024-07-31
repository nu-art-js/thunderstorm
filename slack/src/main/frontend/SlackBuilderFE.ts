import {BaseSlackBuilder, ThreadPointer} from '../shared';
import {ModuleFE_Slack} from './ModuleFE_Slack';

/**
 * FE implementation of slack message builder
 */
export class SlackBuilderFE
	extends BaseSlackBuilder {

	constructor(channel: string) {
		super(channel);
	}

	protected sendMessage: () => Promise<ThreadPointer | undefined> = async () => {
		return (await ModuleFE_Slack.vv1.postStructuredMessage({
			message: {
				channel: this.channel,
				blocks: this.blocks,
			}
		}).executeSync()).threadPointer;
	};

	protected sendFiles: (tp: ThreadPointer) => Promise<void> = async (threadPointer) => {
		await Promise.all(this.files.map(async file => {
			const response = await ModuleFE_Slack.vv1.postFiles({
				file: file.file,
				name: file.fileName,
				thread: threadPointer
			}).executeSync();
			if (!response.ok)
				return this.logError(response.error);
		}));
	};

	protected sendReplies: (tp: ThreadPointer) => Promise<void> = async (threadPointer) => {
		for (const reply of this.replies) {
			await ModuleFE_Slack.vv1.postStructuredMessage({
				message: {
					blocks: reply
				}, thread: threadPointer
			}).executeSync();
		}
	};
}