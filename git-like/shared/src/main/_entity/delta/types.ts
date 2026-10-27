/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DatabaseDef_GitLike_Branch} from '../branch/types.js';

export const GitLike_Delta_DbKey = 'git-like--deltas';

type DBKey = typeof GitLike_Delta_DbKey;
type VersionTypes_GitLike_Delta = { '1.0.0': DB_GitLike_Delta };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_GitLike_Delta>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_GitLike_Delta, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_GitLike_Delta = DB_Prototype<Proto>;
export type UI_GitLike_Delta = DatabaseDef_GitLike_Delta['uiType'];

export type GitLike_DeltaBody = Record<string, unknown> & {_id: string};

export type DB_GitLike_Delta = DB_Object<DBKey> & {
	branchId: DatabaseDef_GitLike_Branch['id'];
	sourceDbKey: string;
	docId: string;
	tombstone: boolean;
	document?: GitLike_DeltaBody;
	origin?: GitLike_DeltaBody;
	baseUpdated: number;
};

export type GitLike_Delta = DB_GitLike_Delta;
