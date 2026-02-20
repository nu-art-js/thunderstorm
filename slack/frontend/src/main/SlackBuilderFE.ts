import {BaseSlackBuilder} from '@nu-art/slack-shared';
import {ModuleFE_Slack} from './ModuleFE_Slack.js';

/**
 * FE implementation of slack message builder
 */
export class SlackBuilderFE
	extends BaseSlackBuilder {

	constructor(channel: string) {
		super(channel);
	}

	send = async () => {
		await ModuleFE_Slack.sendFEMessage({
			channel: this.channel,
			messageBlocks: this.blocks,
			messageReplies: this.replies,
		});
	};

	protected sendMessage = undefined;

	protected sendFiles = undefined;

	protected sendReplies = undefined;
}