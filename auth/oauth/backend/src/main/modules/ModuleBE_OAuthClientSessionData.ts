/*
 * @nu-art/oauth-backend — session JWT claim for the authenticated OAuth client row
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BaseSessionClaims, CollectSessionData, MemKey_SessionData, SessionKey_BE} from '@nu-art/user-account-backend';
import {
	SessionData_OAuthClient,
	SessionKey_OAuthClient,
	type OAuthClientSession,
	type DatabaseDef_OAuthClient,
} from '@nu-art/oauth-shared';

/** Set before session create so the listener stamps this client row onto the new JWT. */
export const MemKey_OAuthClientId = new MemKey<DatabaseDef_OAuthClient['dbType']['_id']>('oauth-client-row-id');

export const SessionKey_OAuthClient_BE = new SessionKey_BE<SessionData_OAuthClient>(SessionKey_OAuthClient);

const clientIdFromSession = (): OAuthClientSession['clientId'] | undefined => {
	const sessionData = MemKey_SessionData.peak();
	if (!sessionData || !(SessionKey_OAuthClient in sessionData))
		return undefined;

	const clientId = SessionKey_OAuthClient_BE.get(sessionData).clientId;
	if (clientId.length === 0)
		return undefined;

	return clientId;
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
