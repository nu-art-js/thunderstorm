/*
 * @nu-art/oauth-backend - OAuth 2.1 Authorization Server for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {OnDispatch} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_OAuthGrant, DBDef_OAuthGrant, OAuthTokenKind_OAuthJwt, UI_OAuthGrant} from '@nu-art/oauth-shared';
import {DispatchKey_AccountOAuthGrants, graph_OnAccountDeleted, type OnAccountDeleted} from '@nu-art/user-account-backend';
import type {DB_Account} from '@nu-art/user-account-shared';

export class ModuleBE_OAuthGrantDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_OAuthGrant>
	implements OnAccountDeleted {

	constructor() {
		super(DBDef_OAuthGrant);
	}

	protected async preWriteProcessing(dbInstance: UI_OAuthGrant): Promise<void> {
		dbInstance.tokenKind ??= OAuthTokenKind_OAuthJwt;
	}

	@OnDispatch(graph_OnAccountDeleted, {key: DispatchKey_AccountOAuthGrants})
	async __onAccountDeleted(account: DB_Account): Promise<void> {
		const grants = await this.query.unManipulatedQuery({where: {userId: account._id}});
		for (const grant of grants)
			await this.delete.unique(grant._id);
	}
}

export const ModuleBE_OAuthGrantDB = new ModuleBE_OAuthGrantDB_Class();
