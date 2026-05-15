import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '@nu-art/user-account-shared';

type VersionTypes_PasswordResetToken = { '1.0.0': DB_PasswordResetToken }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_PasswordResetToken>;
type Dependencies = {}
type UniqueKeys = 'accountId';
type GeneratedProps = 'token' | 'expiresAt'
type DBKey = 'password-auth--reset-token'

export type DatabaseDef_PasswordResetToken = DB_Prototype<DB_ProtoSeed<DB_PasswordResetToken, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;

export type DB_PasswordResetToken = DB_Object<DBKey> & {
	accountId: DB_Account['_id'];
	token: string;
	expiresAt: number;
	consumedAt?: number;
};
