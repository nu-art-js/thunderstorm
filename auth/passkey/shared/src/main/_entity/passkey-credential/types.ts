/*
 * @nu-art/passkey-shared - Passkey/WebAuthn shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '@nu-art/user-account-shared';

export const PasskeyCredential_DbKey = 'passkey--credentials';
type DBKey = typeof PasskeyCredential_DbKey;

type VersionTypes = { '1.0.0': DB_PasskeyCredential };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'credentialId';
type GeneratedKeys = 'lastUsedAt';
type Dependencies = {};

export type DB_PasskeyCredential = DB_Object<DBKey> & {
	accountId: DB_Account['_id'];
	credentialId: string;
	publicKey: string;
	counter: number;
	transports: AuthenticatorTransportType[];
	label: string;
	lastUsedAt?: number;
	backedUp: boolean;
};

export type AuthenticatorTransportType = 'usb' | 'ble' | 'nfc' | 'internal' | 'hybrid';

export type DatabaseDef_PasskeyCredential = DB_Prototype<DB_ProtoSeed<DB_PasskeyCredential, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_PasskeyCredential = DatabaseDef_PasskeyCredential['uiType'];
