/*
 * @nu-art/app-config-shared - App config entity types and DB_Prototype
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';


type VersionTypes_AppConfig = {
	'1.0.0': DB_AppConfig
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_AppConfig>;
type Dependencies = {}

type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'app-configs';

export type DatabaseDef_AppConfig<D = any> = DB_Prototype<DB_ProtoSeed<DB_AppConfig<D>, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;

export type UI_AppConfig = DatabaseDef_AppConfig['uiType'];
export type DB_AppConfig<D = any> = DB_Object<DBKey> & {
	key: string;
	data: D;
}
