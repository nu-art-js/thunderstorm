/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateUniqueId, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_GitLike_Review} from './types.js';
import {GitLike_ReviewStates} from './types.js';

export const GitLike_Review_modifiablePropsValidator: DatabaseDef_GitLike_Review['modifiablePropsValidator'] = {
	branchId: tsValidateUniqueId,
	state: tsValidateValue([...GitLike_ReviewStates]),
};

export const GitLike_Review_generatedPropsValidator: DatabaseDef_GitLike_Review['generatedPropsValidator'] = {};
