/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {StorageKey} from '@nu-art/thunder-core';
import {startRegistration, startAuthentication} from '@simplewebauthn/browser';
import {
	API_Passkey,
	ApiDef_Passkey,
	RegistrationOptionsResponse,
	RegistrationVerifyResponse,
	AuthenticationOptionsResponse,
} from '@nu-art/passkey-shared';
import {LoggedStatus, ModuleFE_Account, type OnLoginStatusUpdated, StorageKey_DeviceId} from '@nu-art/user-account-frontend';
import {ModuleFE_PasskeyCredentialDB} from './_entity/passkey-credential/ModuleFE_PasskeyCredentialDB.js';

const StorageKey_PasskeyRegistered = new StorageKey<boolean>('passkey--registered-on-device').withstandDeletion();

type Config = {
	autoPasskeyFlow: boolean;
};

class ModuleFE_PasskeyAuth_Class
	extends Module<Config>
	implements OnLoginStatusUpdated {

	constructor() {
		super();
		this.setDefaultConfig({autoPasskeyFlow: false});
	}

	__onLoginStatusUpdated() {
		if (!this.config.autoPasskeyFlow)
			return;

		if (!ModuleFE_Account.isStatus(LoggedStatus.LOGGED_IN))
			return;

		if (!this.browserSupportsPasskeys())
			return;

		this.tryAutoRegister();
	}

	private async tryAutoRegister() {
		const credentials = ModuleFE_PasskeyCredentialDB.cache.all();
		if (credentials.length > 0) {
			StorageKey_PasskeyRegistered.set(true);
			return;
		}

		try {
			await this.register(`${navigator.platform} ${new Date().toLocaleDateString()}`);
		} catch (e: any) {
			this.logDebug(`Auto-register skipped: ${e.message ?? e.name}`);
		}
	}

	async tryAutoLogin(): Promise<boolean> {
		if (!this.config.autoPasskeyFlow)
			return false;

		if (!this.browserSupportsPasskeys())
			return false;

		if (!StorageKey_PasskeyRegistered.get())
			return false;

		try {
			await this.login();
			return true;
		} catch (e: any) {
			this.logDebug(`Auto-login not available: ${e.message ?? e.name}`);
			return false;
		}
	}

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

		const result = await this._registerVerify({
			attestationResponse: attestationResponse as any,
			label,
		});

		StorageKey_PasskeyRegistered.set(true);
		return result;
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

		StorageKey_PasskeyRegistered.set(true);
	}

	browserSupportsPasskeys(): boolean {
		return !!window.PublicKeyCredential;
	}
}

export const ModuleFE_PasskeyAuth = new ModuleFE_PasskeyAuth_Class();
