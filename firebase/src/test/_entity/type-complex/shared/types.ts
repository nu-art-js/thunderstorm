import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_Type_Complex = { '1.0.0': DB_Type_Complex }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = string;
type Proto = Proto_DB_Object<DB_Type_Complex, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_Type_Complex = DBProto<Proto>;
export type UI_Type_Complex = DBProto_Type_Complex['uiType'];

export type DB_Type_Complex = DB_Object & {
	refs: string[]
	name: string
	parentId?: string
}