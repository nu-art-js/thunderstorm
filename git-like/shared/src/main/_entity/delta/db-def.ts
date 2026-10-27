/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import type {DatabaseDef_GitLike_Delta} from './types.js';
import {GitLike_Delta_DbKey} from './types.js';
import {GitLike_Delta_generatedPropsValidator, GitLike_Delta_modifiablePropsValidator} from './validators.js';

export const DBDef_GitLike_Delta: Database<DatabaseDef_GitLike_Delta> = {
	modifiablePropsValidator: GitLike_Delta_modifiablePropsValidator,
	generatedPropsValidator: GitLike_Delta_generatedPropsValidator,
	versions: ['1.0.0'],
	dbKey: GitLike_Delta_DbKey,
	entityName: 'GitLike_Delta',
	uniqueKeys: ['_id'],
	frontend: {
		group: 'git-like',
		name: 'delta',
	},
	backend: {
		name: 'git-like--deltas',
	},
};
