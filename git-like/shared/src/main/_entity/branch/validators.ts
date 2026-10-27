/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateBoolean, tsValidateString} from '@nu-art/ts-common';
import type {DatabaseDef_GitLike_Branch} from './types.js';

export const GitLike_Branch_modifiablePropsValidator: DatabaseDef_GitLike_Branch['modifiablePropsValidator'] = {
	label: tsValidateString(),
	reviewRequired: tsValidateBoolean(),
};

export const GitLike_Branch_generatedPropsValidator: DatabaseDef_GitLike_Branch['generatedPropsValidator'] = {};
