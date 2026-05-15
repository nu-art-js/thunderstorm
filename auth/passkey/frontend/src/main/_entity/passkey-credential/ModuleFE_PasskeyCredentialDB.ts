/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {CrudApiDef} from '@nu-art/db-api-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_PasskeyCredential, DBDef_PasskeyCredential} from '@nu-art/passkey-shared';

export interface OnPasskeyCredentialsUpdated {
	__onPasskeyCredentialsUpdated: (...params: ApiCallerEventType<DatabaseDef_PasskeyCredential['dbType']>) => void;
}

export const dispatch_onPasskeyCredentialsChanged = new ThunderDispatcher<OnPasskeyCredentialsUpdated, '__onPasskeyCredentialsUpdated'>('__onPasskeyCredentialsUpdated');

export class ModuleFE_PasskeyCredentialDB_Class
	extends ModuleFE_BaseApi<DatabaseDef_PasskeyCredential> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_PasskeyCredential>(DBDef_PasskeyCredential),
			crudApiDef: CrudApiDef<DatabaseDef_PasskeyCredential>(DBDef_PasskeyCredential.dbKey),
			dispatcher: (...args) => dispatch_onPasskeyCredentialsChanged.dispatchAll(...args),
		});
	}
}

export const ModuleFE_PasskeyCredentialDB = new ModuleFE_PasskeyCredentialDB_Class();
