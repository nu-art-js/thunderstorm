/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthToken, DBDef_OAuthToken, OAuthTokenKind_OAuthJwt, UI_OAuthToken} from '@nu-art/oauth-shared';
import {type OnAccountDeleted} from '@nu-art/user-account-backend';
import type {DB_Account} from '@nu-art/user-account-shared';

export class ModuleBE_OAuthTokenDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthToken>
	implements OnAccountDeleted {

	constructor() {
		super(DBDef_OAuthToken);
	}

	protected async preWriteProcessing(dbInstance: UI_OAuthToken): Promise<void> {
		dbInstance.tokenKind ??= OAuthTokenKind_OAuthJwt;
	}

	async __onAccountDeleted(account: DB_Account): Promise<void> {
		const tokens = await this.query.unManipulatedQuery({where: {userId: account._id}});
		for (const token of tokens)
			await this.delete.unique(token._id);
	}
}

export const ModuleBE_OAuthTokenDB = new ModuleBE_OAuthTokenDB_Class();
