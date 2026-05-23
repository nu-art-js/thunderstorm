/*
 * @nu-art/passkey-backend - Passkey/WebAuthn backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {ApiHandler, MemKey_HttpRequestHeaders} from '@nu-art/http-server';
import {CollectAuthMethodStatus, MemKey_AccountId, ModuleBE_AccountDB, ModuleBE_AuthGate, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {
	API_Passkey,
	ApiDef_Passkey,
	AuthenticatorTransportType,
	DB_PasskeyCredential,
} from '@nu-art/passkey-shared';
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
	VerifiedRegistrationResponse,
	VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import {ModuleBE_PasskeyCredentialDB} from '../_entity/passkey-credential/ModuleBE_PasskeyCredentialDB.js';

type AllowedDomain = {
	rpId: string;
	origins: string[];
};

type Config = {
	enabled: boolean;
	rpName: string;
	allowedDomains: AllowedDomain[];
	challengeTtlMs: number;
};

const DefaultConfig: Config = {
	enabled: true,
	rpName: '',
	allowedDomains: [],
	challengeTtlMs: 300_000,
};

type PendingChallenge = {
	challenge: string;
	accountId?: string;
	createdAt: number;
};

export class ModuleBE_PasskeyAuth_Class
	extends Module<Config>
	implements CollectAuthMethodStatus {

	private readonly pendingChallenges = new Map<string, PendingChallenge>();

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	protected init(): void {
		if (!this.config.rpName || this.config.allowedDomains.length === 0)
			this.logWarningBold('Passkey module requires rpName and at least one allowedDomains entry to be configured.');
	}

	private resolveDomainForRequest(): AllowedDomain {
		const headers = MemKey_HttpRequestHeaders.get();
		const requestOrigin = headers.origin;
		if (!requestOrigin)
			throw HttpCodes._4XX.BAD_REQUEST('Missing Origin header — cannot determine passkey domain');

		const domain = this.config.allowedDomains.find(d => d.origins.includes(requestOrigin));
		if (!domain)
			throw HttpCodes._4XX.BAD_REQUEST(`Origin "${requestOrigin}" is not in the allowed passkey domains`);

		return domain;
	}

	private getAllOrigins(): string[] {
		return this.config.allowedDomains.flatMap(d => d.origins);
	}

	private getAllRpIds(): string[] {
		return this.config.allowedDomains.map(d => d.rpId);
	}

	__collectAuthMethodStatus() {
		return {
			key: 'passkey',
			status: {enabled: this.config.enabled},
		};
	}

	private cleanExpiredChallenges(): void {
		const now = Date.now();
		for (const [key, pending] of this.pendingChallenges) {
			if (now - pending.createdAt > this.config.challengeTtlMs)
				this.pendingChallenges.delete(key);
		}
	}

	@ApiHandler(ApiDef_Passkey.registerOptions)
	async registerOptions(_body: API_Passkey['registerOptions']['Body']): Promise<API_Passkey['registerOptions']['Response']> {
		if (!this.config.enabled)
			throw HttpCodes._4XX.FORBIDDEN('Passkey authentication is disabled');

		ModuleBE_AuthGate.assertRegistrationAllowed();

		const accountId = MemKey_AccountId.get();
		const account = await ModuleBE_AccountDB.query.unique(accountId);
		if (!account)
			throw HttpCodes._4XX.UNAUTHORIZED('No authenticated account');

		const existingCredentials = await ModuleBE_PasskeyCredentialDB.query.custom({
			where: {accountId},
		});

		const domain = this.resolveDomainForRequest();

		const options = await generateRegistrationOptions({
			rpName: this.config.rpName,
			rpID: domain.rpId,
			userName: account.email,
			userDisplayName: account.email,
			attestationType: 'none',
			authenticatorSelection: {
				residentKey: 'required',
				userVerification: 'preferred',
			},
			excludeCredentials: existingCredentials.map(cred => ({
				id: cred.credentialId,
				transports: cred.transports as any[],
			})),
		});

		this.cleanExpiredChallenges();
		this.pendingChallenges.set(accountId, {
			challenge: options.challenge,
			accountId,
			createdAt: Date.now(),
		});

		return {options: options as any};
	}

	@ApiHandler(ApiDef_Passkey.registerVerify)
	async registerVerify(body: API_Passkey['registerVerify']['Body']): Promise<API_Passkey['registerVerify']['Response']> {
		const accountId = MemKey_AccountId.get();
		const pending = this.pendingChallenges.get(accountId);
		if (!pending)
			throw HttpCodes._4XX.BAD_REQUEST('No pending registration challenge found. Please restart the registration flow.');

		if (Date.now() - pending.createdAt > this.config.challengeTtlMs) {
			this.pendingChallenges.delete(accountId);
			throw HttpCodes._4XX.BAD_REQUEST('Registration challenge expired. Please restart the registration flow.');
		}

		let verification: VerifiedRegistrationResponse;
		try {
			verification = await verifyRegistrationResponse({
				response: body.attestationResponse as any,
				expectedChallenge: pending.challenge,
				expectedOrigin: this.getAllOrigins(),
				expectedRPID: this.getAllRpIds(),
			});
		} catch (error: any) {
			this.pendingChallenges.delete(accountId);
			throw HttpCodes._4XX.BAD_REQUEST('Registration verification failed', error.message);
		}

		if (!verification.verified || !verification.registrationInfo) {
			this.pendingChallenges.delete(accountId);
			throw HttpCodes._4XX.BAD_REQUEST('Registration verification failed');
		}

		this.pendingChallenges.delete(accountId);

		const {credential, credentialBackedUp} = verification.registrationInfo;

		const dbCredential = await ModuleBE_PasskeyCredentialDB.create.item({
			accountId,
			credentialId: credential.id,
			publicKey: Buffer.from(credential.publicKey).toString('base64url'),
			counter: credential.counter,
			transports: (body.attestationResponse.response.transports ?? []) as AuthenticatorTransportType[],
			label: body.label,
			backedUp: credentialBackedUp,
		});

		return {
			credential: {
				_id: dbCredential._id,
				credentialId: dbCredential.credentialId,
				label: dbCredential.label,
				transports: dbCredential.transports,
				backedUp: dbCredential.backedUp,
			},
		};
	}

	@ApiHandler(ApiDef_Passkey.loginOptions)
	async loginOptions(_body: API_Passkey['loginOptions']['Body']): Promise<API_Passkey['loginOptions']['Response']> {
		if (!this.config.enabled)
			throw HttpCodes._4XX.FORBIDDEN('Passkey authentication is disabled');

		const domain = this.resolveDomainForRequest();

		const options = await generateAuthenticationOptions({
			rpID: domain.rpId,
			userVerification: 'preferred',
		});

		const challengeId = crypto.randomUUID();

		this.cleanExpiredChallenges();
		this.pendingChallenges.set(challengeId, {
			challenge: options.challenge,
			createdAt: Date.now(),
		});

		return {options: options as any, challengeId};
	}

	@ApiHandler(ApiDef_Passkey.loginVerify)
	async loginVerify(body: API_Passkey['loginVerify']['Body']): Promise<API_Passkey['loginVerify']['Response']> {
		this.logInfo(`loginVerify: challengeId=${body.challengeId}`);

		const pending = this.pendingChallenges.get(body.challengeId);
		if (!pending) {
			this.logWarning(`loginVerify: no pending challenge found for id=${body.challengeId}, active challenges: ${this.pendingChallenges.size}`);
			throw HttpCodes._4XX.BAD_REQUEST('No pending authentication challenge found. Please restart the login flow.');
		}

		const age = Date.now() - pending.createdAt;
		if (age > this.config.challengeTtlMs) {
			this.logWarning(`loginVerify: challenge expired (age=${age}ms, ttl=${this.config.challengeTtlMs}ms)`);
			this.pendingChallenges.delete(body.challengeId);
			throw HttpCodes._4XX.BAD_REQUEST('Authentication challenge expired. Please restart the login flow.');
		}

		const credentialId = body.assertionResponse.id;
		this.logInfo(`loginVerify: looking up credentialId="${credentialId}"`);

		const credentials = await ModuleBE_PasskeyCredentialDB.query.custom({
			where: {credentialId},
			limit: 1,
		});

		if (credentials.length === 0) {
			this.logWarning(`loginVerify: credential NOT found in DB for id="${credentialId}"`);
			this.pendingChallenges.delete(body.challengeId);
			throw HttpCodes._4XX.UNAUTHORIZED('Credential not recognized');
		}

		const credential = credentials[0];
		this.logInfo(`loginVerify: credential found, accountId=${credential.accountId}, counter=${credential.counter}`);

		let verification: VerifiedAuthenticationResponse;
		try {
			verification = await verifyAuthenticationResponse({
				response: body.assertionResponse as any,
				expectedChallenge: pending.challenge,
				expectedOrigin: this.getAllOrigins(),
				expectedRPID: this.getAllRpIds(),
				credential: {
					id: credential.credentialId,
					publicKey: Buffer.from(credential.publicKey, 'base64url'),
					counter: credential.counter,
					transports: credential.transports as any[],
				},
			});
		} catch (error: any) {
			this.logWarning(`loginVerify: verification threw — ${error.message}`);
			this.pendingChallenges.delete(body.challengeId);
			throw HttpCodes._4XX.UNAUTHORIZED('Authentication verification failed', error.message);
		}

		if (!verification.verified) {
			this.logWarning('loginVerify: verification returned verified=false');
			this.pendingChallenges.delete(body.challengeId);
			throw HttpCodes._4XX.UNAUTHORIZED('Authentication verification failed');
		}

		this.pendingChallenges.delete(body.challengeId);
		this.logInfo(`loginVerify: verified OK, creating session for account=${credential.accountId}`);

		await ModuleBE_PasskeyCredentialDB.set.item({
			...credential,
			counter: verification.authenticationInfo.newCounter,
			lastUsedAt: Date.now(),
		} as DB_PasskeyCredential);

		MemKey_AccountId.set(credential.accountId);

		const initialClaims = {
			accountId: credential.accountId,
			deviceId: body.deviceId,
			label: 'passkey-login',
		};

		await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
	}

	@ApiHandler(ApiDef_Passkey.deleteCredential)
	async deleteCredential(body: API_Passkey['deleteCredential']['Body']): Promise<API_Passkey['deleteCredential']['Response']> {
		const accountId = MemKey_AccountId.get();

		const credentials = await ModuleBE_PasskeyCredentialDB.query.custom({
			where: {credentialId: body.credentialId},
			limit: 1,
		});

		if (credentials.length === 0)
			throw HttpCodes._4XX.NOT_FOUND('Credential not found');

		const credential = credentials[0];
		if (credential.accountId !== accountId)
			throw HttpCodes._4XX.FORBIDDEN('Credential does not belong to this account');

		await ModuleBE_PasskeyCredentialDB.delete.item(credential);
	}
}

export const ModuleBE_PasskeyAuth = new ModuleBE_PasskeyAuth_Class();
