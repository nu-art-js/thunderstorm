import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_Topic = {
	'1.0.0': DB_Topic
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Topic>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type GeneratedProps = 'type' | 'refId'
type Proto = Proto_DB_Object<DB_Topic, 'topics', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_Topic = DBProto<Proto>;

export type UI_Topic = DBProto_Topic['uiType'];
export type DB_Topic = DB_Object & {
	type: string; // collection name- e.g 'variables' / 'values'
	refId: string; // a collection object's _id
}
