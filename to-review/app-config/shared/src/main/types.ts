/*
 * @nu-art/app-config-shared - App config entity types and CrudTypes
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {CrudTypes, DatabasePrototype, DB_Object, Proto_DB_Object, VersionsDeclaration} from '@nu-art/db-api-shared';


type VersionTypes_AppConfig = {
	'1.0.0': DB_AppConfig
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AppConfig>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'app-configs';
type Proto<D> = Proto_DB_Object<DB_AppConfig<D>, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_AppConfig<D = any> = DatabasePrototype<Proto<D>>;

export type UI_AppConfig = DBProto_AppConfig['uiType'];
export type DB_AppConfig<D = any> = DB_Object<DBKey> & {
	key: string;
	data: D;
}


export type AppConfigCrudTypes = CrudTypes<
	DBProto_AppConfig['dbKey'],
	DBProto_AppConfig['dbType'],
	DBProto_AppConfig['uiType'],
	DBProto_AppConfig['editableType'],
	DBProto_AppConfig['modifiablePropsValidator'],
	DBProto_AppConfig['uniqueKeys']
>;
