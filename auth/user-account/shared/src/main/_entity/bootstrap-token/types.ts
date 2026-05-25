import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DatabaseDef_Account} from '../account/types.js';

type VersionTypes = { '1.0.0': DB_BootstrapToken };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueIds = '_id';
type DBKey = 'user-account--bootstrap-tokens';
type GeneratedKeys = never;
type Dependencies = {};

export type DatabaseDef_BootstrapToken = DB_Prototype<DB_ProtoSeed<DB_BootstrapToken, DBKey, GeneratedKeys, Versions, UniqueIds, Dependencies>>;

export type UI_BootstrapToken = DatabaseDef_BootstrapToken['uiType'];

export type DB_BootstrapToken = DB_Object<DBKey> & {
	accountId: DatabaseDef_Account['id'];
	label: string;
	metadata?: Record<string, string>;
	revoked: boolean;
};
