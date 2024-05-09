import {DB_Object, DBProto, PreDB, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';
import {FB_ArrayType} from '../../../firestore-v3/_core/types';

type VersionTypes_Type_Complex = { '1.0.0': DB_Type }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = string;
type Proto = Proto_DB_Object<DB_Type, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_Type = DBProto<Proto>;
export type UI_Type = DBProto_Type['uiType'];

export type DB_Type = DB_Object & {
	_uniqueId: UniqueId,
	numeric: number,
	stringValue: string
	booleanValue: boolean
	stringArray: string[]
	objectArray: FB_ArrayType[]
	nestedObject?: { one: FB_ArrayType, two: FB_ArrayType }
}

export type TestInputValue = PreDB<DB_Type>[];