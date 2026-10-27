/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import type {DatabaseDef_GitLike_Review} from './types.js';
import {GitLike_Review_DbKey} from './types.js';
import {GitLike_Review_generatedPropsValidator, GitLike_Review_modifiablePropsValidator} from './validators.js';

export const DBDef_GitLike_Review: Database<DatabaseDef_GitLike_Review> = {
	modifiablePropsValidator: GitLike_Review_modifiablePropsValidator,
	generatedPropsValidator: GitLike_Review_generatedPropsValidator,
	versions: ['1.0.0'],
	dbKey: GitLike_Review_DbKey,
	entityName: 'GitLike_Review',
	uniqueKeys: ['_id'],
	frontend: {
		group: 'git-like',
		name: 'review',
	},
	backend: {
		name: 'git-like--reviews',
	},
};
