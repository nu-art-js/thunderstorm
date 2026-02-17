import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {DB_Account} from '../account/index.js';

type VersionTypes = { '1.0.0': DB_Session };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueIds = '_id' | 'accountId' | 'deviceId';
type DBKey = 'user-account--sessions';
type GeneratedKeys = keyof DB_Object<DBKey>;
type Dependencies = {};

export type DatabaseDef_Session = DB_Prototype<DB_ProtoSeed<DB_Session, DBKey, GeneratedKeys, Versions, UniqueIds, Dependencies>>;

export type UI_Session = DatabaseDef_Session['uiType'];

export type DB_Session = DB_Object<DBKey> & {
	validSessionJwtMd5s: DB_Session['_id'][];
	label?: string;
	accountId: DB_Account['_id'];
	deviceId: string;
	linkedSessionId?: DB_Session['_id'];
	sessionIdJwt: string;
};
