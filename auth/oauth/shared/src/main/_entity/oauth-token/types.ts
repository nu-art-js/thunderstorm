/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const OAuthToken_DbKey = 'oauth--tokens';
type DBKey = typeof OAuthToken_DbKey;
type VersionTypes = { '1.0.0': DB_OAuthToken };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'tokenHash';
type GeneratedProps = 'tokenHash' | 'expiresAt' | 'issuedAt';
type Dependencies = {};

export type DB_OAuthToken = DB_Object<DBKey> & {
	tokenHash: string;
	clientId: string;
	userId: string;
	scopes: string[];
	expiresAt: number;
	issuedAt: number;
	revoked: boolean;
	tokenType: 'access' | 'refresh';
};

export type DatabaseDef_OAuthToken = DB_Prototype<DB_ProtoSeed<DB_OAuthToken, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_OAuthToken = DatabaseDef_OAuthToken['uiType'];
