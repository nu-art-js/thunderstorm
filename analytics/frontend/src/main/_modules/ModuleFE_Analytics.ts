import {ApiCaller, type ApiDefCaller} from '@nu-art/http-client';
import {ApiDef_Analytics, API_Analytics} from '@nu-art/analytics-shared';
import {Module} from '@nu-art/ts-common';

type Config = {
	baseURL: string;
};

type Analytics_SendEvent = { request: { event: unknown }; response: void };
type Analytics_UpdateUser = { request: { mode: 'set' | 'set_once'; userData: Record<string, unknown> }; response: void };
type Analytics_UpdateLexicon = { request: { mode: 'set' | 'set_once'; lexiconMap: Record<string, { id: string; label: string }> }; response: void };

class ModuleFE_Analytics_Class
	extends Module<Config> {

	readonly _v1 = {
		sendEvent: (payload: Analytics_SendEvent['request']) => ({ executeSync: () => this.callSendEvent(payload) }),
		updateUser: (payload: Analytics_UpdateUser['request']) => ({ executeSync: () => this.callUpdateUser(payload) }),
		updateLexicon: (payload: Analytics_UpdateLexicon['request']) => ({ executeSync: () => this.callUpdateLexicon(payload) }),
	} as ApiDefCaller<API_Analytics>;

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).sendEvent)
	private async callSendEvent(_p: Analytics_SendEvent['request']): Promise<Analytics_SendEvent['response']> {
		return undefined;
	}

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).updateUser)
	private async callUpdateUser(_p: Analytics_UpdateUser['request']): Promise<Analytics_UpdateUser['response']> {
		return undefined;
	}

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).updateLexicon)
	private async callUpdateLexicon(_p: Analytics_UpdateLexicon['request']): Promise<Analytics_UpdateLexicon['response']> {
		return undefined;
	}
}

export const ModuleFE_Analytics = new ModuleFE_Analytics_Class();