import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_AppConfig = {
	'1.0.0': DB_AppConfig
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AppConfig>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = never
type Proto<D> = Proto_DB_Object<DB_AppConfig<D>, 'app-configs', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_AppConfig<D = any> = DBProto<Proto<D>>;

export type UI_AppConfig = DBProto_AppConfig['uiType'];
export type DB_AppConfig<D = any> = DB_Object & {
	key: string;
	data: D;
}