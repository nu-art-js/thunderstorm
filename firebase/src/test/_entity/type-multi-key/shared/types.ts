import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_Type_MultiKey = { '1.0.0': DB_Type_MultiKey }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Type_MultiKey>;
type Dependencies = {}
type UniqueKeys = 'aKey' | 'bKey';
type GeneratedProps = never
type DBKey = string;
type Proto = Proto_DB_Object<DB_Type_MultiKey, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_Type_MultiKey = DBProto<Proto>;
export type UI_Type_MultiKey = DBProto_Type_MultiKey['uiType'];

export type DB_Type_MultiKey = DB_Object & {
	aKey: string;
	bKey: number;
}