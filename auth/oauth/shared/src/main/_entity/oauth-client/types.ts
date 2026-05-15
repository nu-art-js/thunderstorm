/*
 * @nu-art/oauth-shared - OAuth 2.1 shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const OAuthClient_DbKey = 'oauth--clients';
type DBKey = typeof OAuthClient_DbKey;
type VersionTypes = { '1.0.0': DB_OAuthClient };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'clientId';
type GeneratedProps = 'clientSecret';
type Dependencies = {};

export type DB_OAuthClient = DB_Object<DBKey> & {
	clientId: string;
	clientSecret: string;
	name: string;
	redirectUris: string[];
	allowedScopes: string[];
	clientType: 'public' | 'confidential';
	enabled: boolean;
};

export type DatabaseDef_OAuthClient = DB_Prototype<DB_ProtoSeed<DB_OAuthClient, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_OAuthClient = DatabaseDef_OAuthClient['uiType'];
