/*
 * @nu-art/editable-item-e2e-tests - Shared test entity types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_EditableTest = {
	'1.0.0': DB_EditableTest
};
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_EditableTest>;
type Dependencies = Record<string, never>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Proto = Proto_DB_Object<DB_EditableTest, 'editable-test', GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DBProto_EditableTest = DBProto<Proto>;

export type UI_EditableTest = DBProto_EditableTest['uiType'];
export type DB_EditableTest = DB_Object & {
	a: string;
	b: string;
	c: string;
	d: string;
};
