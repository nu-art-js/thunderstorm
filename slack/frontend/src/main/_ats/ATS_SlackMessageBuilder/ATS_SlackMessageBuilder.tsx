import { AppToolsScreen, Button, ComponentSync } from "@nu-art/thunder-routing/index";
import { SlackBuilderFE } from '../../SlackBuilderFE.js';
import { generateHex, ServerErrorSeverity } from '@nu-art/ts-common';
export class ATS_SlackMessageBuilder extends ComponentSync {
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
            .addBlocks(SlackBuilderFE.TextSectionWithTitle('*Ultra long message*', generateHex(5000)))
            .addBlocks(SlackBuilderFE.Divider())
            .addBlocks(SlackBuilderFE.TextSection(`${SlackBuilderFE.SeverityEmoji(ServerErrorSeverity.Debug)} more text`))
            .send();
    };
    render() {
        return <>
			<Button variant={'primary'} onClick={this.sendMessage}>send message</Button>
		</>;
    }
}
