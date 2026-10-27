/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import type {DatabaseDef_GitLike_Branch} from '../branch/types.js';

export const GitLike_Review_DbKey = 'git-like--reviews';
export const GitLike_ReviewStates = ['open', 'in_review', 'approved'] as const;
export type GitLike_ReviewState = typeof GitLike_ReviewStates[number];

type DBKey = typeof GitLike_Review_DbKey;
type VersionTypes_GitLike_Review = { '1.0.0': DB_GitLike_Review };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_GitLike_Review>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_GitLike_Review, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_GitLike_Review = DB_Prototype<Proto>;
export type UI_GitLike_Review = DatabaseDef_GitLike_Review['uiType'];

export type DB_GitLike_Review = DB_Object<DBKey> & {
	branchId: DatabaseDef_GitLike_Branch['id'];
	state: GitLike_ReviewState;
};

export type GitLike_Review = DB_GitLike_Review;
