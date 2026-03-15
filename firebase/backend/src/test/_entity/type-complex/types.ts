import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const TypeComplex_DbKey = 'type-complex';
type DBKey = typeof TypeComplex_DbKey;
type VersionTypes_Type_Complex = { '1.0.0': DB_Type_Complex };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_Complex>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_Type_Complex = DB_Object<DBKey> & {
	refs: string[]
	name: string
	parentId?: string
};

export type DatabaseDef_Type_Complex = DB_Prototype<DB_ProtoSeed<DB_Type_Complex, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_Type_Complex = DatabaseDef_Type_Complex['uiType'];
