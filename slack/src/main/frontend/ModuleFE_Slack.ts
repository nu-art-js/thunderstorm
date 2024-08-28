import {Module} from '@thunder-storm/common';
import {ApiDefCaller} from '@thunder-storm/core';
import {ApiDef_Slack, ApiStruct_Slack} from '../shared';
import {apiWithBody} from '@thunder-storm/core/frontend';

export class ModuleFE_Slack_Class
	extends Module<any, any> {
	readonly vv1: ApiDefCaller<ApiStruct_Slack>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			postMessage: apiWithBody(ApiDef_Slack.vv1.postMessage),
			postStructuredMessage: apiWithBody(ApiDef_Slack.vv1.postStructuredMessage),
			postFiles: apiWithBody(ApiDef_Slack.vv1.postFiles),
		};
	}
}

export const ModuleFE_Slack = new ModuleFE_Slack_Class();
