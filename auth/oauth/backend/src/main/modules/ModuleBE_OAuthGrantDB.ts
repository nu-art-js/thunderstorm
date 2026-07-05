/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthGrant, DBDef_OAuthGrant} from '@nu-art/oauth-shared';

export class ModuleBE_OAuthGrantDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthGrant> {

	constructor() {
		super(DBDef_OAuthGrant);
	}
}

export const ModuleBE_OAuthGrantDB = new ModuleBE_OAuthGrantDB_Class();
