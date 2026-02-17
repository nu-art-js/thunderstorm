import {CrudTypes, DatabasePrototype, DB_Object, Proto_DB_Object, VersionsDeclaration} from '@nu-art/db-api-shared';
import {TypedKeyValue} from '@nu-art/ts-common';
import {DB_Account} from '../account/index.js';

type VersionTypes = { '1.0.0': DB_Session };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueIds = '_id' | 'accountId' | 'deviceId';
type DBKey = 'user-account--sessions';
type GeneratedKeys = keyof DB_Object<DBKey>;
type Dependencies = {};

type Proto = Proto_DB_Object<DB_Session, DBKey, GeneratedKeys, Versions, UniqueIds, Dependencies>;
export type DBProto_Session = DatabasePrototype<Proto>;

export type SessionCrudTypes = CrudTypes<
	DBProto_Session['dbKey'],
	DBProto_Session['dbType'],
	DBProto_Session['uiType'],
	DBProto_Session['editableType'],
	DBProto_Session['modifiablePropsValidator'],
	DBProto_Session['uniqueKeys']
>;

export type UI_Session = DBProto_Session['uiType'];

export type DB_Session = DB_Object<DBKey> & {
	validSessionJwtMd5s: DB_Session['_id'][];
	label?: string;
	accountId: DB_Account['_id'];
	deviceId: string;
	linkedSessionId?: DB_Session['_id'];
	sessionIdJwt: string;
};

export type _SessionKey_SessionId = TypedKeyValue<'_id', DB_Session['_id']>;
