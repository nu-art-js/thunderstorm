/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import {
	composeGitLikeView,
	gitLikeDeltaId,
	gitLikeMergeAllowed,
	gitLikeReviewId,
	GitLike_RefusedDbKeys,
	withoutDomainAccess,
} from '@nu-art/git-like-shared';
import type {
	DatabaseDef_GitLike_Branch,
	GitLike_Branch,
	GitLike_Delta,
	GitLike_DeltaBody,
	GitLike_Review,
	GitLike_ReviewState,
} from '@nu-art/git-like-shared';
import type {GitLike_Binding} from './binding.js';
import {MemKey_GitLike_BranchId} from './consts.js';

export type GitLike_BranchRecord = Pick<GitLike_Branch, '_id' | 'label' | 'reviewRequired'> & {
	__access?: {writers?: string[]};
};

export type GitLike_LiveDoc = GitLike_DeltaBody & {__updated?: number};

export type GitLike_Collection = {
	dbKey: string;
	writeLive: (item: GitLike_LiveDoc) => Promise<unknown>;
	deleteLive: (id: string) => Promise<unknown>;
	queryUnique: (id: string) => Promise<GitLike_LiveDoc | undefined>;
	queryAll: () => Promise<GitLike_LiveDoc[]>;
};

export type GitLike_CollectionApi = {
	dbKey: string;
	set: {item: (item: GitLike_LiveDoc) => Promise<unknown>};
	delete: {unique: (id: string) => Promise<unknown>};
	query: {
		unique: (id: string) => Promise<GitLike_LiveDoc | undefined>;
		all: () => Promise<GitLike_LiveDoc[]>;
	};
};

export type GitLike_RouterDeps = {
	activeBranchId: () => string | undefined;
	callerKey: () => string | undefined;
	saveBranch: (branch: GitLike_BranchRecord) => Promise<void>;
	readBranch: (id: string) => Promise<GitLike_BranchRecord | undefined>;
	saveReview: (review: Pick<GitLike_Review, '_id' | 'branchId' | 'state'>) => Promise<void>;
	readReview: (branchId: string) => Promise<Pick<GitLike_Review, '_id' | 'branchId' | 'state'> | undefined>;
	saveDelta: (delta: GitLike_Delta) => Promise<void>;
	readDelta: (branchId: string, sourceDbKey: string, docId: string) => Promise<GitLike_Delta | undefined>;
	listDeltas: (branchId: string, sourceDbKey: string) => Promise<GitLike_Delta[]>;
	readBinding: (callerKey: string) => Promise<DatabaseDef_GitLike_Branch['id'] | undefined>;
	saveBinding: (callerKey: string, branchId: DatabaseDef_GitLike_Branch['id']) => Promise<void>;
	listBindings: (branchId: DatabaseDef_GitLike_Branch['id']) => Promise<GitLike_Binding[]>;
};

export class GitLike_Router {
	constructor(private readonly deps: GitLike_RouterDeps) {
	}

	async createBranch(branch: GitLike_BranchRecord, accountId?: string): Promise<void> {
		const writers = [...(branch.__access?.writers ?? [])];
		if (accountId && !writers.includes(accountId))
			writers.push(accountId);
		const stored: GitLike_BranchRecord = accountId
			? {...branch, __access: {...branch.__access, writers}}
			: branch;
		await this.deps.saveBranch(stored);
		await this.deps.saveReview({
			_id: gitLikeReviewId(branch._id),
			branchId: branch._id,
			state: 'open',
		});
	}

	async bind(callerKey: string, branchId: DatabaseDef_GitLike_Branch['id'], accountId: string): Promise<void> {
		const branch = await this.deps.readBranch(branchId);
		if (!branch)
			throw HttpCodes._4XX.NOT_FOUND('GitLike branch not found');
		if (!(branch.__access?.writers ?? []).includes(accountId))
			throw HttpCodes._4XX.FORBIDDEN('GitLike caller is not a writer on this branch');
		await this.deps.saveBinding(callerKey, branchId);
	}

	async listBindings(branchId: DatabaseDef_GitLike_Branch['id']): Promise<GitLike_Binding[]> {
		return this.deps.listBindings(branchId);
	}

	async setReviewState(branchId: string, state: GitLike_ReviewState): Promise<void> {
		const review = await this.deps.readReview(branchId);
		if (!review)
			throw HttpCodes._4XX.NOT_FOUND('GitLike review not found');

		await this.deps.saveReview({...review, state});
	}

	async onSet(collection: GitLike_Collection, item: GitLike_LiveDoc): Promise<unknown> {
		const branchId = await resolveCallerBranch(this.deps);
		if (!branchId)
			return collection.writeLive(item);

		const live = await readLive(collection, item._id);
		const prior = await this.deps.readDelta(branchId, collection.dbKey, item._id);
		const delta: GitLike_Delta = {
			_id: gitLikeDeltaId(branchId, collection.dbKey, item._id),
			branchId,
			sourceDbKey: collection.dbKey,
			docId: item._id,
			tombstone: false,
			document: item,
			origin: prior?.origin ?? live,
			baseUpdated: prior?.baseUpdated ?? live?.__updated ?? 0,
		} as GitLike_Delta;
		await this.deps.saveDelta(delta);
		return item;
	}

	async onDelete(collection: GitLike_Collection, docId: string): Promise<unknown> {
		const branchId = await resolveCallerBranch(this.deps);
		if (!branchId)
			return collection.deleteLive(docId);

		const live = await readLive(collection, docId);
		const prior = await this.deps.readDelta(branchId, collection.dbKey, docId);
		if (!live && !prior)
			throw HttpCodes._4XX.NOT_FOUND('GitLike document not found');

		const delta: GitLike_Delta = {
			_id: gitLikeDeltaId(branchId, collection.dbKey, docId),
			branchId,
			sourceDbKey: collection.dbKey,
			docId,
			tombstone: true,
			origin: prior?.origin ?? live,
			baseUpdated: prior?.baseUpdated ?? live?.__updated ?? 0,
		} as GitLike_Delta;
		await this.deps.saveDelta(delta);
		return {deleted: docId};
	}

	async branchView(collection: GitLike_Collection, branchId: string): Promise<GitLike_LiveDoc[]> {
		const live = await collection.queryAll();
		const liveIds = new Set(live.map(doc => doc._id));
		const deltas = await this.deps.listDeltas(branchId, collection.dbKey);
		const visible = deltas.filter(delta => liveIds.has(delta.docId) || !delta.origin);
		return composeGitLikeView(live, visible);
	}

	async applyMerge(collection: GitLike_Collection, branchId: string): Promise<void> {
		const branch = await this.deps.readBranch(branchId);
		const review = await this.deps.readReview(branchId);
		if (!branch || !review)
			throw HttpCodes._4XX.NOT_FOUND('GitLike branch not found');

		if (!gitLikeMergeAllowed(branch.reviewRequired, review.state))
			throw HttpCodes._4XX.FORBIDDEN('GitLike review is not approved');

		const deltas = await this.deps.listDeltas(branchId, collection.dbKey);
		for (const delta of deltas) {
			if (delta.tombstone) {
				await collection.deleteLive(delta.docId);
				continue;
			}
			if (!delta.document)
				continue;
			await collection.writeLive(withoutDomainAccess(delta.document) as GitLike_LiveDoc);
		}
	}
}

export function attachGitLike(api: GitLike_CollectionApi, router: GitLike_Router): GitLike_Collection {
	if ((GitLike_RefusedDbKeys as readonly string[]).includes(api.dbKey))
		throw HttpCodes._4XX.BAD_REQUEST(`GitLike cannot enroll ${api.dbKey}`);

	const collection: GitLike_Collection = {
		dbKey: api.dbKey,
		writeLive: api.set.item.bind(api.set),
		deleteLive: api.delete.unique.bind(api.delete),
		queryUnique: api.query.unique.bind(api.query),
		queryAll: api.query.all.bind(api.query),
	};
	api.set.item = (item) => router.onSet(collection, item);
	api.delete.unique = (id) => router.onDelete(collection, id);
	return collection;
}

/**
 * No caller key stays on the active branch, which is live when that is unset.
 * A caller key with no binding is refused. A bound key enters that branch.
 */
async function resolveCallerBranch(deps: GitLike_RouterDeps): Promise<string | undefined> {
	const callerKey = deps.callerKey();
	if (!callerKey)
		return deps.activeBranchId();

	const bound = await deps.readBinding(callerKey);
	if (!bound)
		throw HttpCodes._4XX.FORBIDDEN('GitLike caller is not bound to a branch');

	MemKey_GitLike_BranchId.set(bound);
	return bound;
}

async function readLive(collection: GitLike_Collection, id: string): Promise<GitLike_LiveDoc | undefined> {
	try {
		return await collection.queryUnique(id);
	} catch {
		return undefined;
	}
}
