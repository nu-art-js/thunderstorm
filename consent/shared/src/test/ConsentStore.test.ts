/*
 * @nu-art/consent-shared - Generic consent categories, stored choice and subscriptions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ConsentStore, type ConsentStorage, type ConsentStoreOptions} from '../main/ConsentStore.js';
import {ConsentCategory_Analytics, ConsentCategory_Marketing, ConsentCategory_Necessary, DefaultConsentCategories} from '../main/types.js';

class MemoryStorage
	implements ConsentStorage {
	readonly data = new Map<string, string>();
	getItem = (key: string) => this.data.get(key) ?? null;
	setItem = (key: string, value: string) => void this.data.set(key, value);
	removeItem = (key: string) => void this.data.delete(key);
}

const day = 24 * 60 * 60 * 1000;
let now = 1_800_000_000_000;
let storage: MemoryStorage;
const categories = [...DefaultConsentCategories, {key: 'video-embeds'}];
const create = (overrides: Partial<ConsentStoreOptions> = {}) => new ConsentStore({
	categories,
	policyVersion: 1,
	maxAgeMs: 365 * day,
	storage,
	storageKey: 'consent',
	now: () => now,
	...overrides,
});

describe('consent - ConsentStore', () => {
	beforeEach(() => {
		now = 1_800_000_000_000;
		storage = new MemoryStorage();
	});

	it('grants nothing optional before a decision; necessary is always granted', () => {
		const store = create();
		expect(store.hasDecided()).to.equal(false);
		expect(store.isGranted(ConsentCategory_Necessary)).to.equal(true);
		expect(store.isGranted(ConsentCategory_Analytics)).to.equal(false);
		expect(store.isGranted('video-embeds')).to.equal(false);
		expect(store.isGranted('unknown')).to.equal(false);
	});

	it('accept all grants every category, including app-defined ones, and persists', () => {
		const store = create();
		store.acceptAll();
		expect(categories.every(c => store.isGranted(c.key))).to.equal(true);
		expect(create().isGranted('video-embeds')).to.equal(true);
	});

	it('reject all keeps only necessary and still counts as a decision', () => {
		const store = create();
		store.rejectAll();
		expect(store.hasDecided()).to.equal(true);
		expect(store.isGranted(ConsentCategory_Necessary)).to.equal(true);
		expect(store.isGranted(ConsentCategory_Analytics)).to.equal(false);
		expect(create().hasDecided()).to.equal(true);
	});

	it('a per-category choice cannot revoke a required category', () => {
		const store = create();
		store.decide({[ConsentCategory_Necessary]: false, [ConsentCategory_Analytics]: true});
		expect(store.getChoice()?.granted).to.deep.equal({necessary: true, functional: false, analytics: true, marketing: false, 'video-embeds': false});
	});

	it('notifies only the categories that changed', () => {
		const store = create();
		const calls: string[] = [];
		store.subscribe(ConsentCategory_Analytics, granted => calls.push(`analytics:${granted}`));
		store.subscribe(ConsentCategory_Marketing, granted => calls.push(`marketing:${granted}`));
		store.subscribe(ConsentCategory_Necessary, granted => calls.push(`necessary:${granted}`));
		store.decide({[ConsentCategory_Analytics]: true});
		store.decide({[ConsentCategory_Analytics]: true});
		store.withdraw();
		expect(calls).to.deep.equal(['analytics:true', 'analytics:false']);
	});

	it('unsubscribe stops notifications', () => {
		const store = create();
		const calls: boolean[] = [];
		const unsubscribe = store.subscribe(ConsentCategory_Analytics, granted => calls.push(granted));
		unsubscribe();
		store.acceptAll();
		expect(calls).to.deep.equal([]);
	});

	it('onChange reports decisions and withdrawal', () => {
		const store = create();
		const seen: (boolean | undefined)[] = [];
		store.onChange(choice => seen.push(choice?.granted.analytics));
		store.acceptAll();
		store.withdraw();
		expect(seen).to.deep.equal([true, undefined]);
		expect(storage.data.size).to.equal(0);
	});

	it('asks again after a policy version bump', () => {
		create().acceptAll();
		const store = create({policyVersion: 2});
		expect(store.hasDecided()).to.equal(false);
		expect(store.isGranted(ConsentCategory_Analytics)).to.equal(false);
		expect(storage.data.size).to.equal(0);
	});

	it('asks again once the choice is older than maxAgeMs', () => {
		create().acceptAll();
		now += 366 * day;
		expect(create().hasDecided()).to.equal(false);
	});

	it('ignores a corrupt or future-dated stored choice', () => {
		storage.setItem('consent', '{not json');
		expect(create().hasDecided()).to.equal(false);
		storage.setItem('consent', JSON.stringify({policyVersion: 1, decidedAt: now + day, granted: {analytics: true}}));
		expect(create().isGranted(ConsentCategory_Analytics)).to.equal(false);
	});

	it('a category added after the decision starts as not granted', () => {
		create({categories: DefaultConsentCategories}).acceptAll();
		const store = create();
		expect(store.isGranted(ConsentCategory_Analytics)).to.equal(true);
		expect(store.isGranted('video-embeds')).to.equal(false);
	});

	it('rejects duplicate category keys', () => {
		expect(() => create({categories: [{key: 'a'}, {key: 'a'}]})).to.throw('Duplicate consent category');
	});
});
