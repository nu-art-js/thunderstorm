/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {TS_Object} from '@nu-art/ts-common';

export const OAuthGrant_DbKey = 'oauth--grants';
type DBKey = typeof OAuthGrant_DbKey;
type VersionTypes = { '1.0.0': DB_OAuthGrant };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'authorizationCode';
type GeneratedProps = 'authorizationCode' | 'expiresAt';
type Dependencies = {};

export type DB_OAuthGrant = DB_Object<DBKey> & {
	clientId: string;
	userId: string;
	scopes: string[];
	authorizationCode: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256';
	redirectUri: string;
	expiresAt: number;
	used: boolean;
	resource?: string;
	oauthState?: string;
	context?: TS_Object;
	sessionJwt?: string;
	tokenKind?: 'oauth-jwt' | 'session-jwt';
};

export type DatabaseDef_OAuthGrant = DB_Prototype<DB_ProtoSeed<DB_OAuthGrant, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_OAuthGrant = DatabaseDef_OAuthGrant['uiType'];
