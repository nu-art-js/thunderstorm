import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const TypeMultiKey_DbKey = 'type-multi-key';
type DBKey = typeof TypeMultiKey_DbKey;
type VersionTypes_Type_MultiKey = { '1.0.0': DB_Type_MultiKey };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_MultiKey>;
type Dependencies = {};
type UniqueKeys = 'aKey' | 'bKey';
type GeneratedProps = never;

export type DB_Type_MultiKey = DB_Object<DBKey> & {
	aKey: string;
	bKey: number;
};

export type DatabaseDef_Type_MultiKey = DB_Prototype<DB_ProtoSeed<DB_Type_MultiKey, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_Type_MultiKey = DatabaseDef_Type_MultiKey['uiType'];
