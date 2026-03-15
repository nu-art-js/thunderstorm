import {ApiCaller} from '@nu-art/http-client';
import {ApiDef_Analytics} from '@nu-art/analytics-shared';
import {Module} from '@nu-art/ts-common';

type Config = {
	baseURL: string;
};

type Analytics_SendEvent = { request: { event: unknown }; response: void };
type Analytics_UpdateUser = { request: { mode: 'set' | 'set_once'; userData: Record<string, unknown> }; response: void };
type Analytics_UpdateLexicon = { request: { mode: 'set' | 'set_once'; lexiconMap: Record<string, { id: string; label: string }> }; response: void };

class ModuleFE_Analytics_Class
	extends Module<Config> {

	sendEvent(payload: Analytics_SendEvent['request']): { executeSync: () => Promise<Analytics_SendEvent['response']> } {
		return { executeSync: () => this.runSendEvent(payload) };
	}

	updateUser(payload: Analytics_UpdateUser['request']): { executeSync: () => Promise<Analytics_UpdateUser['response']> } {
		return { executeSync: () => this.runUpdateUser(payload) };
	}

	updateLexicon(payload: Analytics_UpdateLexicon['request']): { executeSync: () => Promise<Analytics_UpdateLexicon['response']> } {
		return { executeSync: () => this.runUpdateLexicon(payload) };
	}

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).sendEvent)
	private async runSendEvent(_p: Analytics_SendEvent['request']): Promise<Analytics_SendEvent['response']> {
		return undefined;
	}

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).updateUser)
	private async runUpdateUser(_p: Analytics_UpdateUser['request']): Promise<Analytics_UpdateUser['response']> {
		return undefined;
	}

	@ApiCaller((m: ModuleFE_Analytics_Class) => ApiDef_Analytics(m.config.baseURL).updateLexicon)
	private async runUpdateLexicon(_p: Analytics_UpdateLexicon['request']): Promise<Analytics_UpdateLexicon['response']> {
		return undefined;
	}
}

export const ModuleFE_Analytics = new ModuleFE_Analytics_Class();