import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';
import {PreDB, UniqueId} from '@nu-art/ts-common';
import {FB_ArrayType} from '../../../firestore-v3/_core/types.js';

export const Type_DbKey = 'type';
type DBKey = typeof Type_DbKey;
type VersionTypes_Type_Complex = { '1.0.0': DB_Type };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_Type = DB_Object<DBKey> & {
	_uniqueId: UniqueId,
	numeric: number,
	stringValue: string
	booleanValue: boolean
	stringArray: string[]
	objectArray: FB_ArrayType[]
	nestedObject?: { one: FB_ArrayType, two: FB_ArrayType }
};

export type DatabaseDef_Type = DB_Prototype<DB_ProtoSeed<DB_Type, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_Type = DatabaseDef_Type['uiType'];

export type TestInputValue = PreDB<DB_Type>[];
