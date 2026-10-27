/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {gitLikeConsentContent, gitLikeConsentScreen} from '@nu-art/git-like-shared';
import type {DatabaseDef_GitLike_Branch, GitLike_ReviewState} from '@nu-art/git-like-shared';
import type {GitLike_ConsentScreenData} from '@nu-art/git-like-shared';
import {MemKey_GitLike_FromPage} from './consts.js';
import type {GitLike_BranchRecord, GitLike_Collection, GitLike_Router} from './router.js';

export type GitLike_ConsentPayload = {
	content: string;
	structuredContent: GitLike_ConsentScreenData;
};

export function openGitLikeConsent(
	branchLabel: string,
	collection: string,
	deltas: readonly {docId: string; tombstone: boolean; origin?: unknown; document?: {label?: unknown}}[],
): GitLike_ConsentPayload {
	const structuredContent = gitLikeConsentScreen(branchLabel, collection, deltas);
	return {content: gitLikeConsentContent(structuredContent), structuredContent};
}

export function assertGitLikeFromPage(): void {
	if (MemKey_GitLike_FromPage.peak() !== true)
		throw HttpCodes._4XX.FORBIDDEN('GitLike call did not come from the consent screen');
}

/** The screen sets the mark, then runs the button. A direct call does not. */
export async function gitLikeOnPage<T>(action: () => Promise<T>): Promise<T> {
	if (!MemStorage.getStore())
		return new MemStorage().init(() => gitLikeOnPage(action));
	MemKey_GitLike_FromPage.set(true);
	return action();
}

export async function gitLikeCreateOnPage(
	router: GitLike_Router,
	branch: GitLike_BranchRecord,
	accountId: string,
	callerKey: string,
): Promise<void> {
	assertGitLikeFromPage();
	await router.createBranch(branch, accountId);
	await router.bind(callerKey, branch._id, accountId);
}

export async function gitLikeBindOnPage(
	router: GitLike_Router,
	callerKey: string,
	branchId: DatabaseDef_GitLike_Branch['id'],
	accountId: string,
): Promise<void> {
	assertGitLikeFromPage();
	await router.bind(callerKey, branchId, accountId);
}

export async function gitLikeReviewOnPage(
	router: GitLike_Router,
	branchId: string,
	state: GitLike_ReviewState,
): Promise<void> {
	assertGitLikeFromPage();
	await router.setReviewState(branchId, state);
}

export async function gitLikeMergeOnPage(
	router: GitLike_Router,
	collection: GitLike_Collection,
	branchId: string,
): Promise<void> {
	assertGitLikeFromPage();
	await router.applyMerge(collection, branchId);
}
