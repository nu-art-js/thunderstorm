import {DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_DeletedDoc = { '1.0.0': DB_DeletedDoc }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_DeletedDoc>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = '__deleted__docs'
type Proto = Proto_DB_Object<DB_DeletedDoc, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_DeletedDoc = DBProto<Proto>;
export type UI_DeletedDoc = DBProto_DeletedDoc['uiType'];

export type DB_DeletedDoc = DB_Object & {
	__collectionName: string;
	__docId: UniqueId;
}