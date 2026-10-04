/*
 * @nu-art/oauth-shared — OAuth client claim on the session JWT
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TypedKeyValue} from '@nu-art/ts-common';
import type {DatabaseDef_OAuthClient} from './_entity/oauth-client/types.js';

export const SessionKey_OAuthClient = 'oauthClient';

/** The authenticated OAuth client row. `clientId` is that row's `_id`. */
export type OAuthClientSession = {
	clientId: DatabaseDef_OAuthClient['dbType']['_id'];
};

export type SessionData_OAuthClient = TypedKeyValue<typeof SessionKey_OAuthClient, OAuthClientSession>;
