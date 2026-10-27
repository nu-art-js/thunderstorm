/*
 * @nu-art/git-like-backend - GitLike write, view, and merge
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {HttpCodes} from '@nu-art/api-types';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {gitLikeReviewId} from '@nu-art/git-like-shared';
import type {DatabaseDef_GitLike_Branch, GitLike_Delta, GitLike_Review, GitLike_ReviewState} from '@nu-art/git-like-shared';
import {GitLike_BindingStore} from '../main/binding.js';
import {
	gitLikeBindOnPage,
	gitLikeCreateOnPage,
	gitLikeMergeOnPage,
	gitLikeOnPage,
	gitLikeReviewOnPage,
	openGitLikeConsent,
} from '../main/consent-screen.js';
import {MemKey_GitLike_BranchId, MemKey_GitLike_CallerKey} from '../main/consts.js';
import {attachGitLike, GitLike_Router} from '../main/router.js';
import type {GitLike_BranchRecord, GitLike_CollectionApi, GitLike_LiveDoc} from '../main/router.js';

const branchId = 'b'.repeat(32) as DatabaseDef_GitLike_Branch['id'];
const sourceDbKey = 'collection-x';

type Store = {
	branches: Map<string, GitLike_BranchRecord>;
	reviews: Map<string, Pick<GitLike_Review, '_id' | 'branchId' | 'state'>>;
	deltas: Map<string, GitLike_Delta>;
	live: Map<string, GitLike_LiveDoc>;
	liveWrites: number;
	liveDeletes: number;
	callerCanWriteLive: boolean;
};

function harness(active?: DatabaseDef_GitLike_Branch['id'], callerKey?: () => string | undefined) {
	const bindings = new GitLike_BindingStore();
	const store: Store = {
		branches: new Map(),
		reviews: new Map(),
		deltas: new Map(),
		live: new Map(),
		liveWrites: 0,
		liveDeletes: 0,
		callerCanWriteLive: true,
	};
	const router = new GitLike_Router({
		activeBranchId: () => active ?? MemKey_GitLike_BranchId.peak(),
		callerKey: () => callerKey?.(),
		readBinding: (key) => bindings.read(key),
		saveBinding: (key, id) => bindings.save(key, id),
		listBindings: (id) => bindings.list(id),
		saveBranch: async (branch) => {
			store.branches.set(branch._id, branch);
		},
		readBranch: async (id) => store.branches.get(id),
		saveReview: async (review) => {
			store.reviews.set(review.branchId, review);
		},
		readReview: async (id) => store.reviews.get(id),
		saveDelta: async (delta) => {
			store.deltas.set(delta._id, delta);
		},
		readDelta: async (id, dbKey, docId) => [...store.deltas.values()].find(delta =>
			delta.branchId === id && delta.sourceDbKey === dbKey && delta.docId === docId),
		listDeltas: async (id, dbKey) => [...store.deltas.values()].filter(delta =>
			delta.branchId === id && delta.sourceDbKey === dbKey),
	});

	const liveWrite = async (item: GitLike_LiveDoc) => {
		if (!store.callerCanWriteLive)
			throw HttpCodes._4XX.FORBIDDEN('live write refused');
		store.liveWrites++;
		store.live.set(item._id, item);
		return item;
	};
	const api: GitLike_CollectionApi = {
		dbKey: sourceDbKey,
		set: {item: liveWrite},
		delete: {
			unique: async (id: string) => {
				if (!store.callerCanWriteLive)
					throw HttpCodes._4XX.FORBIDDEN('live delete refused');
				store.liveDeletes++;
				store.live.delete(id);
				return {deleted: id};
			},
		},
		query: {
			unique: async (id: string) => store.live.get(id),
			all: async () => [...store.live.values()],
		},
	};
	return {store, router, api};
}

const doc = (id: string, label: string, extra: Record<string, unknown> = {}): GitLike_LiveDoc => ({
	_id: id,
	label,
	__updated: 10,
	...extra,
});

describe('GitLike router', () => {
	it('opens a review when a branch is created', async () => {
		const {store, router} = harness();
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true});
		expect(store.reviews.get(branchId)?.state).to.equal('open');
		expect(store.reviews.get(branchId)?._id).to.equal(gitLikeReviewId(branchId));
	});

	it('writes live when no branch is active and stores a delta without a live write when one is', async () => {
		const {store, router, api} = harness();
		const collection = attachGitLike(api, router);
		store.live.set('doc-1', doc('doc-1', 'live'));

		await new MemStorage().init(async () => {
			await api.set.item(doc('doc-1', 'direct'));
		});
		expect(store.liveWrites).to.equal(1);
		expect(store.deltas.size).to.equal(0);

		await new MemStorage().init(async () => {
			MemKey_GitLike_BranchId.set(branchId);
			await api.set.item(doc('doc-1', 'delta'));
		});

		expect(store.liveWrites).to.equal(1);
		expect(store.live.get('doc-1')?.label).to.equal('direct');
		const delta = [...store.deltas.values()][0];
		expect(delta?.document?.label).to.equal('delta');
		expect(delta?.origin?.label).to.equal('direct');
		expect(collection.dbKey).to.equal(sourceDbKey);
	});

	it('lets a live reader contribute and keeps a live-only writer on the live path', async () => {
		const {store, router, api} = harness();
		attachGitLike(api, router);
		store.callerCanWriteLive = false;
		store.live.set('doc-1', doc('doc-1', 'readable'));

		await new MemStorage().init(async () => {
			MemKey_GitLike_BranchId.set(branchId);
			await api.set.item(doc('doc-1', 'from-reader'));
		});

		expect(store.liveWrites).to.equal(0);
		expect([...store.deltas.values()][0]?.document?.label).to.equal('from-reader');
	});

	it('composes replace, add, and tombstone', async () => {
		const {store, router, api} = harness(branchId);
		const collection = attachGitLike(api, router);
		store.live.set('doc-1', doc('doc-1', 'live'));
		store.live.set('doc-3', doc('doc-3', 'gone'));
		await router.onSet(collection, doc('doc-1', 'edited'));
		await router.onSet(collection, doc('doc-2', 'born'));
		await router.onDelete(collection, 'doc-3');

		const visible = await router.branchView(collection, branchId);
		const ids = visible.map(item => item._id).sort();
		expect(ids).to.deep.equal(['doc-1', 'doc-2']);
		expect(visible.find(item => item._id === 'doc-1')?.label).to.equal('edited');
		expect(visible.find(item => item._id === 'doc-3')).to.equal(undefined);
	});

	it('does not return a delta body when the caller can no longer read the live doc', async () => {
		const {store, router, api} = harness(branchId);
		const collection = attachGitLike(api, router);
		store.live.set('doc-1', doc('doc-1', 'live'));
		await router.onSet(collection, doc('doc-1', 'secret'));
		store.live.delete('doc-1');

		const visible = await router.branchView(collection, branchId);
		expect(visible.map(item => item._id)).to.deep.equal([]);
	});

	it('refuses merge until review is approved, then writes live without the delta access bag', async () => {
		const {store, router, api} = harness(branchId);
		const collection = attachGitLike(api, router);
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true});
		store.live.set('doc-1', doc('doc-1', 'live'));
		store.live.set('doc-3', doc('doc-3', 'remove'));
		await router.onSet(collection, doc('doc-1', 'merged', {__access: {readers: ['intruder']}}));
		await router.onDelete(collection, 'doc-3');

		try {
			await router.applyMerge(collection, branchId);
			expect.fail('merge should wait for approval');
		} catch (err) {
			expect(String(err)).to.include('not approved');
		}
		expect(store.live.get('doc-1')?.label).to.equal('live');

		await router.setReviewState(branchId, 'approved' as GitLike_ReviewState);
		await router.applyMerge(collection, branchId);
		expect(store.live.get('doc-1')?.label).to.equal('merged');
		expect(store.live.get('doc-1')).to.not.have.property('__access');
		expect(store.live.has('doc-3')).to.equal(false);
		expect(store.liveDeletes).to.equal(1);
	});

	it('refuses a read-only caller at live write time even after approval', async () => {
		const {store, router, api} = harness(branchId);
		const collection = attachGitLike(api, router);
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true});
		store.live.set('doc-1', doc('doc-1', 'live'));
		await router.onSet(collection, doc('doc-1', 'staged'));
		await router.setReviewState(branchId, 'approved');
		store.callerCanWriteLive = false;

		try {
			await router.applyMerge(collection, branchId);
			expect.fail('live write should refuse the caller');
		} catch (err) {
			expect(String(err)).to.include('live write refused');
		}
		expect(store.live.get('doc-1')?.label).to.equal('live');
	});

	it('refuses an unbound caller and does not write live or create a branch', async () => {
		const {store, router, api} = harness(undefined, () => MemKey_GitLike_CallerKey.peak());
		attachGitLike(api, router);
		store.live.set('doc-1', doc('doc-1', 'live'));

		await new MemStorage().init(async () => {
			MemKey_GitLike_CallerKey.set('chat-a');
			try {
				await api.set.item(doc('doc-1', 'unbound'));
				expect.fail('unbound write should be refused');
			} catch (err) {
				expect(String(err)).to.include('not bound');
			}
		});

		expect(store.liveWrites).to.equal(0);
		expect(store.live.get('doc-1')?.label).to.equal('live');
		expect(store.deltas.size).to.equal(0);
		expect(store.branches.size).to.equal(0);
	});

	it('enters the bound branch and stores a delta without a live write', async () => {
		const {store, router, api} = harness(undefined, () => MemKey_GitLike_CallerKey.peak());
		attachGitLike(api, router);
		const live = doc('doc-1', 'live', {__access: {writers: ['live-writer']}});
		store.live.set('doc-1', live);
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true}, 'account-a');
		await router.bind('chat-a', branchId, 'account-a');

		await new MemStorage().init(async () => {
			MemKey_GitLike_CallerKey.set('chat-a');
			await api.set.item(doc('doc-1', 'on-branch'));
			expect(MemKey_GitLike_BranchId.peak()).to.equal(branchId);
		});

		expect(store.liveWrites).to.equal(0);
		expect(store.live.get('doc-1')?.label).to.equal('live');
		expect(live['__access']).to.deep.equal({writers: ['live-writer']});
		expect([...store.deltas.values()][0]?.document?.label).to.equal('on-branch');
		expect(store.branches.get(branchId)?.__access?.writers).to.deep.equal(['account-a']);
	});

	it('keeps other caller keys in place and refuses a rebind onto a branch the account does not write', async () => {
		const {store, router} = harness();
		const otherId = 'm'.repeat(32) as DatabaseDef_GitLike_Branch['id'];
		const joinedId = 'n'.repeat(32) as DatabaseDef_GitLike_Branch['id'];
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true}, 'account-a');
		await router.createBranch({_id: otherId, label: 'other', reviewRequired: false}, 'account-b');
		await router.bind('chat-a', branchId, 'account-a');
		await router.bind('chat-b', branchId, 'account-a');

		try {
			await router.bind('chat-a', otherId, 'account-a');
			expect.fail('rebind should require a branch writer');
		} catch (err) {
			expect(String(err)).to.include('not a writer');
		}

		await router.createBranch({_id: joinedId, label: 'joined', reviewRequired: false}, 'account-a');
		await router.bind('chat-a', joinedId, 'account-a');

		expect((await router.listBindings(branchId)).map(row => row.callerKey)).to.deep.equal(['chat-b']);
		expect((await router.listBindings(joinedId)).map(row => row.callerKey)).to.deep.equal(['chat-a']);
		expect((await router.listBindings(otherId)).map(row => row.callerKey)).to.deep.equal([]);
		expect(store.branches.get(branchId)?.__access?.writers).to.deep.equal(['account-a']);
		expect(store.branches.get(otherId)?.__access?.writers).to.deep.equal(['account-b']);
	});

	it('gives the model words and keeps the screen data off that string', () => {
		const {store} = harness();
		const payload = openGitLikeConsent('design', sourceDbKey, [
			{docId: 'doc-1', tombstone: false, origin: {label: 'live'}, document: {label: 'Edited'}},
			{docId: 'doc-2', tombstone: false, document: {label: 'Added'}},
			{docId: 'doc-3', tombstone: true, origin: {label: 'Will leave'}},
		]);
		expect(payload.content).to.equal([
			'Branch design',
			`${sourceDbKey} doc-1 replace Edited`,
			`${sourceDbKey} doc-2 add Added`,
			`${sourceDbKey} doc-3 tombstone`,
		].join('\n'));
		expect(payload.content).to.not.include('<');
		const kinds = payload.structuredContent.changes.map(change => change.kind);
		expect(kinds).to.deep.equal(['replace', 'add', 'tombstone']);
		expect(store.liveWrites).to.equal(0);
		expect(store.branches.size).to.equal(0);
	});

	it('refuses create, bind, review, and merge unless the consent screen marked the call', async () => {
		const {store, router, api} = harness();
		const collection = attachGitLike(api, router);
		await router.createBranch({_id: branchId, label: 'design', reviewRequired: true}, 'account-a');
		store.live.set('doc-1', doc('doc-1', 'live'));
		await new MemStorage().init(async () => {
			MemKey_GitLike_BranchId.set(branchId);
			await api.set.item(doc('doc-1', 'staged'));
		});

		await new MemStorage().init(async () => {
			const refused = [
				gitLikeCreateOnPage(router, {_id: branchId, label: 'again', reviewRequired: false}, 'account-a', 'chat-a'),
				gitLikeBindOnPage(router, 'chat-a', branchId, 'account-a'),
				gitLikeReviewOnPage(router, branchId, 'approved'),
				gitLikeMergeOnPage(router, collection, branchId),
			];
			for (const call of refused) {
				try {
					await call;
					expect.fail('page action should be refused');
				} catch (err) {
					expect(String(err)).to.include('consent screen');
				}
			}
		});

		expect(store.reviews.get(branchId)?.state).to.equal('open');
		expect(store.live.get('doc-1')?.label).to.equal('live');
		expect(await router.listBindings(branchId)).to.deep.equal([]);
	});

	it('merges from the consent screen through applyMerge and leaves review short of a live write', async () => {
		const {store, router, api} = harness(undefined, () => MemKey_GitLike_CallerKey.peak());
		const collection = attachGitLike(api, router);
		await gitLikeOnPage(() => gitLikeCreateOnPage(
			router,
			{_id: branchId, label: 'design', reviewRequired: true},
			'account-a',
			'chat-a',
		));
		store.live.set('doc-1', doc('doc-1', 'live'));
		await new MemStorage().init(async () => {
			MemKey_GitLike_CallerKey.set('chat-a');
			await api.set.item(doc('doc-1', 'staged', {__access: {writers: ['intruder']}}));
		});

		await gitLikeOnPage(() => gitLikeReviewOnPage(router, branchId, 'approved'));
		expect(store.reviews.get(branchId)?.state).to.equal('approved');
		expect(store.live.get('doc-1')?.label).to.equal('live');

		await gitLikeOnPage(() => gitLikeMergeOnPage(router, collection, branchId));
		expect(store.live.get('doc-1')?.label).to.equal('staged');
		expect(store.live.get('doc-1')).to.not.have.property('__access');
		expect((await router.listBindings(branchId)).map(row => row.callerKey)).to.deep.equal(['chat-a']);
	});

	it('refuses to enroll accounts, sessions, permissions, and its own collections', () => {
		const {router} = harness();
		expect(() => attachGitLike({
			dbKey: 'user-account--accounts',
			set: {item: async () => undefined},
			delete: {unique: async () => undefined},
			query: {unique: async () => undefined, all: async () => []},
		}, router)).to.throw();
	});
});
