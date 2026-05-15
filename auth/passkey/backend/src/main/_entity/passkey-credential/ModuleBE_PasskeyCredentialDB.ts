/*
 * @nu-art/passkey-backend - Passkey/WebAuthn backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PasskeyCredential, DBDef_PasskeyCredential} from '@nu-art/passkey-shared';

export class ModuleBE_PasskeyCredentialDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PasskeyCredential> {

	constructor() {
		super(DBDef_PasskeyCredential);
	}
}

export const ModuleBE_PasskeyCredentialDB = new ModuleBE_PasskeyCredentialDB_Class();
