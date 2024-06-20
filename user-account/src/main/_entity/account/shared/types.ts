import {
    AuditableV2,
    DB_BaseObject,
    DB_Object,
    DBProto,
    Proto_DB_Object,
    TypedKeyValue,
    VersionsDeclaration
} from '@nu-art/ts-common';

export const _accountTypes = ['user', 'service'];
export const accountTypes = [..._accountTypes] as const;
export type AccountType = typeof accountTypes[number];

type VersionTypes_Account = { '1.0.0': DB_Account };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Account>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedKeys = keyof AuditableV2 | '_newPasswordRequired' | 'salt' | 'saltedPassword';
export const Account_DbKey = 'user-account--accounts';
type Proto = Proto_DB_Object<DB_Account, typeof Account_DbKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>;
export type DBProto_Account = DBProto<Proto>;

export type UI_Account = DBProto_Account['uiType'];
export type SafeDB_Account = UI_Account & DB_BaseObject;


export type UI_SessionAccount = UI_Account & DB_BaseObject & SessionData_HasPassword;
export type _SessionKey_Account = TypedKeyValue<'account', UI_SessionAccount>

export type DB_Account = DB_Object & AuditableV2 & {
    type: AccountType;
    email: string;
    displayName?: string
    thumbnail?: string
    salt?: string
    saltedPassword?: string
    description?: string // mainly for service accounts, will be used to explain the usage of the account
    _newPasswordRequired?: boolean
}

export type SessionData_HasPassword = { hasPassword: boolean };