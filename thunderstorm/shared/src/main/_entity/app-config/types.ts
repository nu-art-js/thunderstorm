import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const AppConfig_DbKey = 'app-configs';
type DBKey = typeof AppConfig_DbKey;
type VersionTypes_AppConfig = {
	'1.0.0': DB_AppConfig<any>
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AppConfig>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_AppConfig<D = any> = DB_Object<DBKey> & {
	key: string;
	data: D;
};

export type DatabaseDef_AppConfig<D = any> = DB_Prototype<DB_ProtoSeed<DB_AppConfig<D>, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_AppConfig = DatabaseDef_AppConfig['uiType'];
