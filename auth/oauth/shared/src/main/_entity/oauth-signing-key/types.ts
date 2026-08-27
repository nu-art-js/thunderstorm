/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const OAuthSigningKey_DbKey = 'oauth--signing-keys';
type DBKey = typeof OAuthSigningKey_DbKey;
type VersionTypes = { '1.0.0': DB_OAuthSigningKey };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'kid';
type GeneratedProps = never;
type Dependencies = {};

export type DB_OAuthSigningKey = DB_Object<DBKey> & {
	kid: string;
	alg: 'RS256' | 'ES256';
	privateJwk: string;
	publicJwk: string;
};

export type DatabaseDef_OAuthSigningKey = DB_Prototype<DB_ProtoSeed<DB_OAuthSigningKey, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_OAuthSigningKey = DatabaseDef_OAuthSigningKey['uiType'];
