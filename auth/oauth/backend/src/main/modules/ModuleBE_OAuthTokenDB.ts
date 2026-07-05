/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthToken, DBDef_OAuthToken} from '@nu-art/oauth-shared';

export class ModuleBE_OAuthTokenDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthToken> {

	constructor() {
		super(DBDef_OAuthToken);
	}
}

export const ModuleBE_OAuthTokenDB = new ModuleBE_OAuthTokenDB_Class();
