/*
 * @nu-art/oauth-backend — session JWT claim for the authenticated OAuth client row
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BaseSessionClaims, CollectSessionData, MemKey_SessionData} from '@nu-art/user-account-backend';
import {
	SessionData_OAuthClient,
	SessionKey_OAuthClient,
	type OAuthClientSession,
	type DatabaseDef_OAuthClient,
} from '@nu-art/oauth-shared';

/** Set before session create so the listener stamps this client row onto the new JWT. */
export const MemKey_OAuthClientId = new MemKey<DatabaseDef_OAuthClient['dbType']['_id']>('oauth-client-row-id');

const clientIdFromSession = (): OAuthClientSession['clientId'] | undefined => {
	const claim = MemKey_SessionData.peak()?.[SessionKey_OAuthClient] as OAuthClientSession | undefined;
	if (typeof claim?.clientId === 'string' && claim.clientId.length > 0)
		return claim.clientId;

	return undefined;
};

class ModuleBE_OAuthClientSessionData_Class
	extends Module
	implements CollectSessionData<SessionData_OAuthClient> {

	async __collectSessionData(_data: BaseSessionClaims): Promise<SessionData_OAuthClient | undefined> {
		const clientId = MemKey_OAuthClientId.peak() ?? clientIdFromSession();
		if (!clientId)
			return undefined;

		return {
			key: SessionKey_OAuthClient,
			value: {clientId},
		};
	}
}

export const ModuleBE_OAuthClientSessionData = new ModuleBE_OAuthClientSessionData_Class();
