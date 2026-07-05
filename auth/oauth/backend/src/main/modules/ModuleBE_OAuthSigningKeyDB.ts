/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthSigningKey, DBDef_OAuthSigningKey} from '@nu-art/oauth-shared';

export class ModuleBE_OAuthSigningKeyDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthSigningKey> {

	constructor() {
		super(DBDef_OAuthSigningKey);
	}
}

export const ModuleBE_OAuthSigningKeyDB = new ModuleBE_OAuthSigningKeyDB_Class();
