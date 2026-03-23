/*
 * @nu-art/sync-manager-backend - Deleted-doc entity types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';
import {UniqueId} from '@nu-art/ts-common';

export const DeletedDoc_DbKey = '__deleted__docs';
type DBKey = typeof DeletedDoc_DbKey;
type VersionTypes_DeletedDoc = { '1.0.0': DB_DeletedDoc };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_DeletedDoc>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_DeletedDoc = DB_Object<DBKey> & {
	__collectionName: string;
	__docId: UniqueId;
};

export type DatabaseDef_DeletedDoc = DB_Prototype<DB_ProtoSeed<DB_DeletedDoc, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_DeletedDoc = DatabaseDef_DeletedDoc['uiType'];
