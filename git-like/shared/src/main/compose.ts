/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {hashToUniqueId} from '@nu-art/db-api-shared';
import {GitLike_Branch_DbKey} from './_entity/branch/types.js';
import {GitLike_Delta_DbKey} from './_entity/delta/types.js';
import type {GitLike_DeltaBody} from './_entity/delta/types.js';
import {GitLike_Review_DbKey} from './_entity/review/types.js';
import type {GitLike_ReviewState} from './_entity/review/types.js';

export {composeGitLikeView} from './view.js';
export type {GitLike_ViewDelta} from './view.js';

export const GitLike_RefusedDbKeys = [
	GitLike_Branch_DbKey,
	GitLike_Review_DbKey,
	GitLike_Delta_DbKey,
	'permissions--access-groups',
	'permissions--scope',
	'permissions--user-permissions',
	'user-account--accounts',
	'user-account--sessions',
] as const;

export function gitLikeDeltaId(branchId: string, sourceDbKey: string, docId: string) {
	return hashToUniqueId<typeof GitLike_Delta_DbKey>(`${branchId}\n${sourceDbKey}\n${docId}`);
}

export function gitLikeReviewId(branchId: string) {
	return hashToUniqueId<typeof GitLike_Review_DbKey>(branchId);
}

export function gitLikeMergeAllowed(reviewRequired: boolean, state: GitLike_ReviewState): boolean {
	return !reviewRequired || state === 'approved';
}

export function withoutDomainAccess<T extends GitLike_DeltaBody>(doc: T): Omit<T, '__access'> {
	const copy = {...doc};
	delete copy.__access;
	return copy;
}
