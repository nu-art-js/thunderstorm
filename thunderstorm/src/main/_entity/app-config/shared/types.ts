import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@thunder-storm/common';

type VersionTypes_AppConfig = {
	'1.0.0': DB_AppConfig
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AppConfig>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = never
type Proto = Proto_DB_Object<DB_AppConfig, 'app-configs', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_AppConfig = DBProto<Proto>;

export type UI_AppConfig = DBProto_AppConfig['uiType'];
export type DB_AppConfig = DB_Object & {
	key: string;
	data: any;
}

