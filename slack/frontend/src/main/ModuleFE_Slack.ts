import {Module} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm-frontend';
import {ApiDef_Slack, ApiStruct_Slack} from '@nu-art/slack-shared';
import {apiWithBody} from '@nu-art/thunderstorm/frontend/index';

export class ModuleFE_Slack_Class
	extends Module<any, any> {
	readonly vv1: ApiDefCaller<ApiStruct_Slack>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			postMessage: apiWithBody(ApiDef_Slack.vv1.postMessage),
			postStructuredMessage: apiWithBody(ApiDef_Slack.vv1.postStructuredMessage),
			postFiles: apiWithBody(ApiDef_Slack.vv1.postFiles),
			sendFEMessage: apiWithBody(ApiDef_Slack.vv1.sendFEMessage),
		};
	}
}

export const ModuleFE_Slack = new ModuleFE_Slack_Class();
