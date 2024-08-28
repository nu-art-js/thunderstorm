import {ModuleBE_Slack, ThreadPointer} from './ModuleBE_Slack';
import {BaseSlackBuilder} from '../shared';

export class SlackBuilderBE
	extends BaseSlackBuilder {

	// ######################## Builder Steps ########################

	constructor(channel?: string) {
		super(channel);
	}

	// ######################## Internal Logic ########################

	protected sendMessage = async () => {
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