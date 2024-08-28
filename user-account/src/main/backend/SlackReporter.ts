import {Logger} from '@thunder-storm/common';
import {ModuleBE_Slack} from '@thunder-storm/slack/backend';
import {MemKey_AccountEmail} from '../_entity/session/backend';

export class SlackReporter extends Logger {

	private fallbackChannel: string = ModuleBE_Slack.getDefaultChannel();
	public report: string;

	constructor(report: string) {
		super('SlackReporter');
		this.report = report;
	}

	public sendReportToUser = async (channel?: string) => {
		try {
			const userId = await ModuleBE_Slack.getUserIdByEmail(MemKey_AccountEmail.get());
			if (!userId)
				return this.sendReportToChannel(channel);

			const dmId = await ModuleBE_Slack.openDM([userId]);
			await ModuleBE_Slack.postMessage(this.report, dmId);
		} catch (err: any) {
			this.logError('Failed to send report to user.\nSending to channel instead.\n', err);
			return this.sendReportToChannel(channel);
		}
	};

	public sendReportToChannel = async (channel?: string) => {
		await ModuleBE_Slack.postMessage(this.report, channel ?? this.fallbackChannel);
	};
}