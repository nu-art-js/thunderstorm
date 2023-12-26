import {Module} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_Slack, ApiStruct_Slack} from '../shared';
import {apiWithBody} from '@nu-art/thunderstorm/frontend';

export class ModuleFE_Slack_Class
	extends Module<any, any> {
	readonly vv1: ApiDefCaller<ApiStruct_Slack>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			postMessage: apiWithBody(ApiDef_Slack.vv1.postMessage),
		};
	}
}

export const ModuleFE_Slack = new ModuleFE_Slack_Class();
