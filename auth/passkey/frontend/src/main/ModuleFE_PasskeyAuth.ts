/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {startRegistration, startAuthentication} from '@simplewebauthn/browser';
import {
	API_Passkey,
	ApiDef_Passkey,
	RegistrationOptionsResponse,
	RegistrationVerifyResponse,
	AuthenticationOptionsResponse,
} from '@nu-art/passkey-shared';
import {StorageKey_DeviceId} from '@nu-art/user-account-frontend';

class ModuleFE_PasskeyAuth_Class
	extends Module {

	@ApiCaller(ApiDef_Passkey.registerOptions)
	private async _registerOptions(_body: API_Passkey['registerOptions']['Body']): Promise<RegistrationOptionsResponse> {
		return undefined as unknown as RegistrationOptionsResponse;
	}

	@ApiCaller(ApiDef_Passkey.registerVerify)
	private async _registerVerify(_body: API_Passkey['registerVerify']['Body']): Promise<RegistrationVerifyResponse> {
		return undefined as unknown as RegistrationVerifyResponse;
	}

	@ApiCaller(ApiDef_Passkey.loginOptions)
	private async _loginOptions(_body: API_Passkey['loginOptions']['Body']): Promise<AuthenticationOptionsResponse> {
		return undefined as unknown as AuthenticationOptionsResponse;
	}

	@ApiCaller(ApiDef_Passkey.loginVerify)
	private async _loginVerify(_body: API_Passkey['loginVerify']['Body']): Promise<void> {
		return undefined as unknown as void;
	}

	@ApiCaller(ApiDef_Passkey.deleteCredential)
	async deleteCredential(_body: API_Passkey['deleteCredential']['Body']): Promise<void> {
		return undefined as unknown as void;
	}

	async register(label: string): Promise<RegistrationVerifyResponse> {
		const {options} = await this._registerOptions({});

		const attestationResponse = await startRegistration({optionsJSON: options as any});

		return this._registerVerify({
			attestationResponse: attestationResponse as any,
			label,
		});
	}

	async login(): Promise<void> {
		const {options, challengeId} = await this._loginOptions({});

		const assertionResponse = await startAuthentication({optionsJSON: options as any});

		const deviceId = StorageKey_DeviceId.get();
		if (!deviceId)
			throw new MUSTNeverHappenException('Missing deviceId');

		await this._loginVerify({
			assertionResponse: assertionResponse as any,
			challengeId,
			deviceId,
		});
	}

	browserSupportsPasskeys(): boolean {
		return !!window.PublicKeyCredential;
	}
}

export const ModuleFE_PasskeyAuth = new ModuleFE_PasskeyAuth_Class();
