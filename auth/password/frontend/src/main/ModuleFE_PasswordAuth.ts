import {Module} from '@nu-art/ts-common';
import {ApiCallContext, ApiCaller} from '@nu-art/http-client';
import {
	API_PasswordAuth,
	ApiDef_PasswordAuth,
	PasswordAssertionConfig,
} from '@nu-art/password-auth-shared';
import {StorageKey} from '@nu-art/thunder-core';

const StorageKey_PasswordAssertionConfig = new StorageKey<PasswordAssertionConfig | undefined>('account__password-assertion-config', false);

class ModuleFE_PasswordAuth_Class
	extends Module {

	@ApiCaller(ApiDef_PasswordAuth.registerAccount)
	async registerAccount(body: API_PasswordAuth['registerAccount']['Body']): Promise<API_PasswordAuth['registerAccount']['Response']> {
		void body;
		return undefined as unknown as API_PasswordAuth['registerAccount']['Response'];
	}

	@ApiCaller(ApiDef_PasswordAuth.login)
	async login(body: API_PasswordAuth['login']['Body']): Promise<API_PasswordAuth['login']['Response']> {
		void body;
		return undefined as unknown as API_PasswordAuth['login']['Response'];
	}

	@ApiCaller(ApiDef_PasswordAuth.changePassword)
	async changePassword(body: API_PasswordAuth['changePassword']['Body']): Promise<API_PasswordAuth['changePassword']['Response']> {
		void body;
		return undefined as unknown as API_PasswordAuth['changePassword']['Response'];
	}

	@ApiCaller(ApiDef_PasswordAuth.setPassword)
	async setPassword(body: API_PasswordAuth['setPassword']['Body']): Promise<API_PasswordAuth['setPassword']['Response']> {
		void body;
		return undefined as unknown as API_PasswordAuth['setPassword']['Response'];
	}

	@ApiCaller(ApiDef_PasswordAuth.getPasswordAssertionConfig, {onComplete: (m: ModuleFE_PasswordAuth_Class, ctx: ApiCallContext<API_PasswordAuth['getPasswordAssertionConfig']>) => m.onPasswordAssertionConfig(ctx)})
	async getPasswordAssertionConfig(_params?: API_PasswordAuth['getPasswordAssertionConfig']['Params']): Promise<API_PasswordAuth['getPasswordAssertionConfig']['Response']> {
		return undefined as unknown as API_PasswordAuth['getPasswordAssertionConfig']['Response'];
	}

	public passwordAssertionConfig = () => StorageKey_PasswordAssertionConfig.get();

	private onPasswordAssertionConfig = async (ctx: ApiCallContext<API_PasswordAuth['getPasswordAssertionConfig']>) => {
		StorageKey_PasswordAssertionConfig.set(ctx.response.config);
	};
}

export const ModuleFE_PasswordAuth = new ModuleFE_PasswordAuth_Class();
