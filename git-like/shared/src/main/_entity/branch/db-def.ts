/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import type {DatabaseDef_GitLike_Branch} from './types.js';
import {GitLike_Branch_DbKey} from './types.js';
import {GitLike_Branch_generatedPropsValidator, GitLike_Branch_modifiablePropsValidator} from './validators.js';

export const DBDef_GitLike_Branch: Database<DatabaseDef_GitLike_Branch> = {
	modifiablePropsValidator: GitLike_Branch_modifiablePropsValidator,
	generatedPropsValidator: GitLike_Branch_generatedPropsValidator,
	versions: ['1.0.0'],
	dbKey: GitLike_Branch_DbKey,
	entityName: 'GitLike_Branch',
	uniqueKeys: ['_id'],
	frontend: {
		group: 'git-like',
		name: 'branch',
	},
	backend: {
		name: 'git-like--branches',
	},
};
