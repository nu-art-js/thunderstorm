/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthClient, DBDef_OAuthClient} from '@nu-art/oauth-shared';

export class ModuleBE_OAuthClientDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthClient> {

	constructor() {
		super(DBDef_OAuthClient);
	}
}

export const ModuleBE_OAuthClientDB = new ModuleBE_OAuthClientDB_Class();
