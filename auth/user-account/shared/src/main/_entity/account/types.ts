import {DB_BaseObject, DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {TypedKeyValue} from '@nu-art/ts-common';
import {AuditableV2} from '../../utils.js';

export const AccountType_User: AccountType = 'user';
export const AccountType_Service: AccountType = 'service';
export const _accountTypes = ['user', 'service'];
export const accountTypes = [..._accountTypes] as const;

export const Account_DbKey = 'user-account--accounts';
export type AccountType = typeof accountTypes[number];

type DBKey = typeof Account_DbKey
type VersionTypes_Account = { '1.0.0': DB_Account };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Account>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedKeys = keyof AuditableV2;

export type DatabaseDef_Account = DB_Prototype<DB_ProtoSeed<DB_Account, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_Account = DatabaseDef_Account['uiType'];
export type DB_Account = DB_Object<DBKey> & AuditableV2 & {
	type: AccountType;
	email: string;
	displayName?: string;
	thumbnail?: string;
	description?: string; // mainly for service accounts, will be used to explain the usage of the account
};

export type UI_SessionAccount = UI_Account & DB_BaseObject<DBKey>;
export type _SessionKey_Account = TypedKeyValue<'account', UI_SessionAccount>;

