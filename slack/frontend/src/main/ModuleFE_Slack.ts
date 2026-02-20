import {Module} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {ApiDef_Slack, API_Slack} from '@nu-art/slack-shared';

export class ModuleFE_Slack_Class
	extends Module<any, any> {

	constructor() {
		super();
	}

	@ApiCaller(ApiDef_Slack.postMessage)
	async postMessage(body: API_Slack['postMessage']['Body']): Promise<API_Slack['postMessage']['Response']> {
		void body;
		return undefined as unknown as API_Slack['postMessage']['Response'];
	}

	@ApiCaller(ApiDef_Slack.postStructuredMessage)
	async postStructuredMessage(body: API_Slack['postStructuredMessage']['Body']): Promise<API_Slack['postStructuredMessage']['Response']> {
		void body;
		return undefined as unknown as API_Slack['postStructuredMessage']['Response'];
	}

	@ApiCaller(ApiDef_Slack.postFiles)
	async postFiles(body: API_Slack['postFiles']['Body']): Promise<API_Slack['postFiles']['Response']> {
		void body;
		return undefined as unknown as API_Slack['postFiles']['Response'];
	}

	@ApiCaller(ApiDef_Slack.sendFEMessage)
	async sendFEMessage(body: API_Slack['sendFEMessage']['Body']): Promise<API_Slack['sendFEMessage']['Response']> {
		void body;
		return undefined as unknown as API_Slack['sendFEMessage']['Response'];
	}
}

export const ModuleFE_Slack = new ModuleFE_Slack_Class();
