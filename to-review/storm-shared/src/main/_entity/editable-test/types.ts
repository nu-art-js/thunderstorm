/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const EditableTest_DbKey = 'editable-test';
type DBKey = typeof EditableTest_DbKey;

export type DB_EditableTest = DB_Object<DBKey> & {
	a: string;
	b: string;
	c: string;
	d: string;
};

type VersionTypes_EditableTest = {
	'1.0.0': DB_EditableTest;
};
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_EditableTest>;
type Dependencies = Record<string, never>;
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DatabaseDef_EditableTest = DB_Prototype<DB_ProtoSeed<DB_EditableTest, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_EditableTest = DatabaseDef_EditableTest['uiType'];
