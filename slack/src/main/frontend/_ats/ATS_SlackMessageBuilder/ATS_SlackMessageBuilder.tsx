import * as React from 'react';
import {AppToolsScreen, ComponentSync, TS_Button} from '@nu-art/thunderstorm/frontend';
import {SlackBuilderFE} from '../../SlackBuilderFE';
import {ServerErrorSeverity} from '@nu-art/ts-common';

export class ATS_SlackMessageBuilder
	extends ComponentSync {

	private readonly testChannel = '_harel-errors';

	static screen: AppToolsScreen = {
		name: 'Slack message tester',
		key: 'slack-message-tester',
		renderer: this,
		group: 'Frontend',
	};

	private sendMessage = async () => {
		const feMessageBuilder = new SlackBuilderFE(this.testChannel);
		return feMessageBuilder
			.addBlocks(SlackBuilderFE.TextSectionWithTitle('*Test title*', 'this message sent from FE!'))
			.addBlocks(SlackBuilderFE.Divider())
			.addBlocks(SlackBuilderFE.TextSection(`${SlackBuilderFE.SeverityEmoji(ServerErrorSeverity.Debug)} more text`))
			.send();
	};

	render() {
		return <>
			<TS_Button onClick={this.sendMessage}>send message</TS_Button>
		</>;
	}
}