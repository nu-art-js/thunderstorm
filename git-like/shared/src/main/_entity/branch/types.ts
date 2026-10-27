/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const GitLike_Branch_DbKey = 'git-like--branches';
type DBKey = typeof GitLike_Branch_DbKey;

type VersionTypes_GitLike_Branch = { '1.0.0': DB_GitLike_Branch };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_GitLike_Branch>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_GitLike_Branch, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;

export type DatabaseDef_GitLike_Branch = DB_Prototype<Proto>;
export type UI_GitLike_Branch = DatabaseDef_GitLike_Branch['uiType'];

export type DB_GitLike_Branch = DB_Object<DBKey> & {
	label: string;
	reviewRequired: boolean;
};

export type GitLike_Branch = DB_GitLike_Branch;
