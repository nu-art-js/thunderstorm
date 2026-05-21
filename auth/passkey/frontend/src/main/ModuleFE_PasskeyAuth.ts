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
		const status = ModuleFE_Account.getLoggedStatus();
		this.logInfo(`Login status updated: ${LoggedStatus[status]}, autoPasskeyFlow: ${this.config.autoPasskeyFlow}`);

		if (!this.config.autoPasskeyFlow)
			return;

		if (!ModuleFE_Account.isStatus(LoggedStatus.LOGGED_IN))
			return;

		if (!this.browserSupportsPasskeys())
			return;

		this.tryAutoRegister();
	}

	private async tryAutoRegister() {
		if (StorageKey_PasskeyRegistered.get()) {
			this.logInfo('tryAutoRegister: flag already set, skipping');
			return;
		}

		const credentials = ModuleFE_PasskeyCredentialDB.cache.all();
		if (credentials.length > 0) {
			StorageKey_PasskeyRegistered.set(true);
			this.logInfo('tryAutoRegister: bootstrapped flag from existing credentials');
			return;
		}

		try {
			this.logInfo('tryAutoRegister: no flag, initiating registration');
			await this.register(`${navigator.platform} ${new Date().toLocaleDateString()}`);
			this.logInfo('tryAutoRegister: registration completed successfully');
		} catch (e: any) {
			this.logWarning(`tryAutoRegister: skipped — ${e.message ?? e.name}`);
		}
	}

	async tryAutoLogin(): Promise<boolean> {
		const passkeyFlag = StorageKey_PasskeyRegistered.get();
		this.logInfo(`tryAutoLogin: autoPasskeyFlow=${this.config.autoPasskeyFlow}, browserSupport=${this.browserSupportsPasskeys()}, storageFlag=${passkeyFlag}`);

		if (!this.config.autoPasskeyFlow)
			return false;

		if (!this.browserSupportsPasskeys())
			return false;

		if (!passkeyFlag)
			return false;

		try {
			await this.login();
			return true;
		} catch (e: any) {
			this.logWarning(`tryAutoLogin: failed — ${e.message ?? e.name}`);
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
		this.logInfo(`register: starting with label "${label}"`);
		const {options} = await this._registerOptions({});
		this.logInfo('register: got options from backend, prompting browser');

		const attestationResponse = await startRegistration({optionsJSON: options as any});
		this.logInfo(`register: browser returned attestation, verifying with backend`);

		const result = await this._registerVerify({
			attestationResponse: attestationResponse as any,
			label,
		});

		StorageKey_PasskeyRegistered.set(true);
		this.logInfo('register: verified and flag set');
		return result;
	}

	async login(): Promise<void> {
		this.logInfo('login: requesting options from backend');
		const {options, challengeId} = await this._loginOptions({});
		this.logInfo(`login: got challenge ${challengeId}, prompting browser`);

		const assertionResponse = await startAuthentication({optionsJSON: options as any});
		this.logInfo(`login: browser returned assertion, credentialId=${assertionResponse.id}`);

		const deviceId = StorageKey_DeviceId.get();
		if (!deviceId)
			throw new MUSTNeverHappenException('Missing deviceId');

		this.logInfo(`login: verifying with backend (deviceId=${deviceId.slice(0, 8)}...)`);
		await this._loginVerify({
			assertionResponse: assertionResponse as any,
			challengeId,
			deviceId,
		});

		StorageKey_PasskeyRegistered.set(true);
		this.logInfo('login: verified successfully, flag set');
	}

	browserSupportsPasskeys(): boolean {
		return !!window.PublicKeyCredential;
	}
}

export const ModuleFE_PasskeyAuth = new ModuleFE_PasskeyAuth_Class();
