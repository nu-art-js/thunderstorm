/*
 * @nu-art/passkey-shared - Passkey/WebAuthn shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import type {DB_PasskeyCredential} from './_entity/passkey-credential/types.js';

export type RegistrationOptionsRequest = {};

export type RegistrationOptionsResponse = {
	options: PublicKeyCredentialCreationOptionsJSON;
};

export type RegistrationVerifyRequest = {
	attestationResponse: RegistrationResponseJSON;
	label: string;
};

export type RegistrationVerifyResponse = {
	credential: Pick<DB_PasskeyCredential, '_id' | 'credentialId' | 'label' | 'transports' | 'backedUp'>;
};

export type AuthenticationOptionsResponse = {
	options: PublicKeyCredentialRequestOptionsJSON;
	challengeId: string;
};

export type AuthenticationVerifyRequest = {
	assertionResponse: AssertionResponseJSON;
	challengeId: string;
	deviceId: string;
};

export type DeleteCredentialRequest = {
	credentialId: string;
};

export type API_Passkey = {
	registerOptions: BodyApi<RegistrationOptionsResponse, RegistrationOptionsRequest>;
	registerVerify: BodyApi<RegistrationVerifyResponse, RegistrationVerifyRequest>;
	loginOptions: BodyApi<AuthenticationOptionsResponse, {}>;
	loginVerify: BodyApi<void, AuthenticationVerifyRequest>;
	deleteCredential: BodyApi<void, DeleteCredentialRequest>;
};

export const ApiDef_Passkey: ApiDefResolver<API_Passkey> = {
	registerOptions: {method: HttpMethod.POST, path: '/v1/auth/passkey/register/options'},
	registerVerify: {method: HttpMethod.POST, path: '/v1/auth/passkey/register/verify'},
	loginOptions: {method: HttpMethod.POST, path: '/v1/auth/passkey/login/options'},
	loginVerify: {method: HttpMethod.POST, path: '/v1/auth/passkey/login/verify'},
	deleteCredential: {method: HttpMethod.POST, path: '/v1/auth/passkey/credential/delete'},
};

export type PublicKeyCredentialCreationOptionsJSON = {
	rp: { name: string; id: string };
	user: { id: string; name: string; displayName: string };
	challenge: string;
	pubKeyCredParams: { alg: number; type: 'public-key' }[];
	timeout?: number;
	attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
	authenticatorSelection?: {
		authenticatorAttachment?: 'platform' | 'cross-platform';
		residentKey?: 'discouraged' | 'preferred' | 'required';
		requireResidentKey?: boolean;
		userVerification?: 'discouraged' | 'preferred' | 'required';
	};
	excludeCredentials?: { id: string; type: 'public-key'; transports?: string[] }[];
};

export type PublicKeyCredentialRequestOptionsJSON = {
	challenge: string;
	timeout?: number;
	rpId?: string;
	allowCredentials?: { id: string; type: 'public-key'; transports?: string[] }[];
	userVerification?: 'discouraged' | 'preferred' | 'required';
};

export type RegistrationResponseJSON = {
	id: string;
	rawId: string;
	response: {
		clientDataJSON: string;
		attestationObject: string;
		transports?: string[];
	};
	authenticatorAttachment?: string;
	clientExtensionResults: Record<string, unknown>;
	type: 'public-key';
};

export type AssertionResponseJSON = {
	id: string;
	rawId: string;
	response: {
		clientDataJSON: string;
		authenticatorData: string;
		signature: string;
		userHandle?: string;
	};
	authenticatorAttachment?: string;
	clientExtensionResults: Record<string, unknown>;
	type: 'public-key';
};
