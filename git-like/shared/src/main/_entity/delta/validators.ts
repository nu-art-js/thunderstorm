/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateBoolean, tsValidateNumber, tsValidateString, tsValidateUniqueId, Validator} from '@nu-art/ts-common';
import type {DatabaseDef_GitLike_Delta, GitLike_DeltaBody} from './types.js';

const optionalBody: Validator<GitLike_DeltaBody | undefined> = (input?: GitLike_DeltaBody) => {
	if (input === undefined)
		return;

	if (typeof input !== 'object' || input === null || Array.isArray(input) || typeof input._id !== 'string')
		return 'body must be an object with _id';
};

export const GitLike_Delta_modifiablePropsValidator: DatabaseDef_GitLike_Delta['modifiablePropsValidator'] = {
	branchId: tsValidateUniqueId,
	sourceDbKey: tsValidateString(),
	docId: tsValidateString(),
	tombstone: tsValidateBoolean(),
	document: optionalBody,
	origin: optionalBody,
	baseUpdated: tsValidateNumber(),
};

export const GitLike_Delta_generatedPropsValidator: DatabaseDef_GitLike_Delta['generatedPropsValidator'] = {};
