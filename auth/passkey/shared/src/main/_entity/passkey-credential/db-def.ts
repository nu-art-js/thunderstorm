/*
 * @nu-art/passkey-shared - Passkey/WebAuthn shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateBoolean, tsValidateNumber, tsValidateString, tsValidateUniqueId, tsValidateValue} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_PasskeyCredential, PasskeyCredential_DbKey} from './types.js';

const Validator_ModifiableProps: DatabaseDef_PasskeyCredential['modifiablePropsValidator'] = {
	accountId: tsValidateUniqueId,
	credentialId: tsValidateString(),
	publicKey: tsValidateString(),
	counter: tsValidateNumber(),
	transports: tsValidateArray(tsValidateValue(['usb', 'ble', 'nfc', 'internal', 'hybrid'])),
	label: tsValidateString(),
	backedUp: tsValidateBoolean(),
};

const Validator_GeneratedProps: DatabaseDef_PasskeyCredential['generatedPropsValidator'] = {
	lastUsedAt: tsValidateNumber(false),
};

export const DBDef_PasskeyCredential: Database<DatabaseDef_PasskeyCredential> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: ['lastUsedAt'],
	versions: ['1.0.0'],
	dbKey: PasskeyCredential_DbKey,
	entityName: 'passkey-credential',
	uniqueKeys: ['credentialId'],
	frontend: {
		group: 'passkey',
		name: 'passkey-credential',
	},
	backend: {
		name: PasskeyCredential_DbKey,
	},
};
