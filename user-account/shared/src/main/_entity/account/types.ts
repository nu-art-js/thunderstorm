import {CrudTypes, DatabasePrototype, DB_BaseObject, DB_Object, DB_ProtoDef, VersionsDeclaration} from '@nu-art/db-api-shared';
import {AuditableV2, TypedKeyValue} from '@nu-art/ts-common';

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
type GeneratedKeys = keyof AuditableV2 | '_newPasswordRequired' | 'salt' | 'saltedPassword';

export type DatabaseDef_Account = DatabasePrototype<DB_ProtoDef<DB_Account, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;

export type AccountCrudTypes = CrudTypes<
	DatabaseDef_Account['dbKey'],
	DatabaseDef_Account['dbType'],
	DatabaseDef_Account['uiType'],
	DatabaseDef_Account['editableType'],
	DatabaseDef_Account['modifiablePropsValidator'],
	DatabaseDef_Account['uniqueKeys']
>;

export type UI_Account = DatabaseDef_Account['uiType'];
export type SafeDB_Account = UI_Account & DB_BaseObject<DBKey>;

export type UI_SessionAccount = UI_Account & DB_BaseObject<DBKey> & SessionData_HasPassword;
export type _SessionKey_Account = TypedKeyValue<'account', UI_SessionAccount>;

export type DB_Account = DB_Object<DBKey> & AuditableV2 & {
	type: AccountType;
	email: string;
	displayName?: string;
	thumbnail?: string;
	salt?: string;
	saltedPassword?: string;
	description?: string; // mainly for service accounts, will be used to explain the usage of the account
	_newPasswordRequired?: boolean;
};

export type SessionData_HasPassword = { hasPassword: boolean };
