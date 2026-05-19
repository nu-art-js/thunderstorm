import {Dispatcher, Module} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_AuthPolicy, API_AuthPolicy, AuthMethodStatus, Response_AuthPolicy} from '@nu-art/user-account-shared';

type Config = {
	canRegister: boolean;
};

export interface CollectAuthMethodStatus {
	__collectAuthMethodStatus(): { key: string; status: AuthMethodStatus };
}

export const dispatch_CollectAuthMethodStatus = new Dispatcher<CollectAuthMethodStatus, '__collectAuthMethodStatus'>('__collectAuthMethodStatus');

export class ModuleBE_AuthGate_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({canRegister: true});
	}

	get canRegister(): boolean {
		return this.config.canRegister;
	}

	assertRegistrationAllowed(): void {
		if (!this.config.canRegister)
			throw HttpCodes._4XX.FORBIDDEN('Registration is globally disabled');
	}

	@ApiHandler(ApiDef_AuthPolicy.getPolicy)
	async getPolicy(_params: API_AuthPolicy['getPolicy']['Params']): Promise<API_AuthPolicy['getPolicy']['Response']> {
		const collected = dispatch_CollectAuthMethodStatus.dispatchModule();
		const methods: Response_AuthPolicy['methods'] = {};
		for (const entry of collected) {
			methods[entry.key] = entry.status;
		}

		return {
			canRegister: this.config.canRegister,
			methods,
		};
	}
}

export const ModuleBE_AuthGate = new ModuleBE_AuthGate_Class();
