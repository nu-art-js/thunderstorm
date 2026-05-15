import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '@nu-art/user-account-shared';

type VersionTypes_PasswordCredentials = { '1.0.0': DB_PasswordCredentials }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PasswordCredentials>;
type Dependencies = {}
type UniqueKeys = 'accountId';
type GeneratedProps = never
type DBKey = 'password-auth--credentials'

export type DatabaseDef_PasswordCredentials = DB_Prototype<DB_ProtoSeed<DB_PasswordCredentials, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_PasswordCredentials = DatabaseDef_PasswordCredentials['uiType'];

export type DB_PasswordCredentials = DB_Object<DBKey> & {
	accountId: DB_Account['_id'];
	salt: string;
	saltedPassword: string;
	_newPasswordRequired?: boolean;
};
