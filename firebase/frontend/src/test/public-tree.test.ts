/*
 * @nu-art/firebase-frontend - Inner /public listeners
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {
	PublicTreeListeners,
	publicPathMatches,
	publicValueAt,
	reducePublicChange,
} from '../main/ModuleFE_FirebaseListener/public-tree.js';

/** Deterministic generator. Example: mulberry32(1)() is stable across runs. */
const mulberry32 = (seed: number): (() => number) => {
	let state = seed;
	return () => {
		state = Math.imul(state ^ (state >>> 15), state | 1);
		state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
		return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
	};
};

/** Example: pathAtDepth(3, 'c') === 'c0/c1/c2' */
const pathAtDepth = (depth: number, branch: string): string =>
	Array.from({length: depth}, (_item, index) => `${branch}${index}`).join('/');

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Copy the tree and set one node. Sibling branches stay. */
const setPath = (tree: unknown, path: string, value: unknown): Record<string, unknown> => {
	const parts = path.split('/');
	const root: Record<string, unknown> = {};
	if (isRecord(tree)) {
		for (const key of Object.keys(tree))
			root[key] = tree[key];
	}

	let cursor = root;
	for (let index = 0; index < parts.length; index++) {
		const key = parts[index];
		if (index === parts.length - 1) {
			cursor[key] = value;
			break;
		}
		const next: Record<string, unknown> = {};
		if (isRecord(cursor[key])) {
			for (const childKey of Object.keys(cursor[key] as Record<string, unknown>))
				next[childKey] = (cursor[key] as Record<string, unknown>)[childKey];
		}
		cursor[key] = next;
		cursor = next;
	}
	return root;
};

const record = () => {
	const calls: Array<{value: unknown; previous: unknown}> = [];
	return {
		calls,
		onChange: (value: unknown, previous: unknown) => {
			calls.push({value, previous});
		},
	};
};

describe('public inner listeners', () => {
	it('matches a listener above, at, and below a changed path', () => {
		const random = mulberry32(0xA11);
		for (let trial = 0; trial < 30; trial++) {
			const changedDepth = 1 + Math.floor(random() * 8);
			const listenerDepth = 1 + Math.floor(random() * 12);
			const changed = pathAtDepth(changedDepth, 'n');
			const listener = pathAtDepth(listenerDepth, 'n');
			const other = pathAtDepth(listenerDepth, 'z');
			expect(publicPathMatches(listener, changed), `${listener} vs ${changed}`).to.equal(true);
			expect(publicPathMatches(other, changed), `${other} vs ${changed}`).to.equal(false);
			expect(publicPathMatches('', changed)).to.equal(true);
		}
	});

	it('emits only the deepest path that differs', () => {
		const before = setPath({}, 'a/b/c/d/e', 1);
		const after = setPath({}, 'a/b/c/d/e', 2);
		expect(reducePublicChange(before, after)).to.deep.equal(['a/b/c/d/e']);
		expect(reducePublicChange({a: {b: {c: 1}}}, {a: 5})).to.deep.equal(['a']);
	});

	it('seeds on the first snapshot and then delivers the slice at each depth', () => {
		const leaf = 'a/b/c/d/e';
		const bus = new PublicTreeListeners();
		const ancestor = record();
		const deep = record();
		const sibling = record();
		bus.listen('a/b', ancestor.onChange);
		bus.listen(leaf, deep.onChange);
		bus.listen('a/x/y/z', sibling.onChange);

		bus.apply(setPath({}, leaf, 'old'));
		expect(ancestor.calls).to.deep.equal([]);
		expect(deep.calls).to.deep.equal([]);
		expect(sibling.calls).to.deep.equal([]);

		bus.apply(setPath({}, leaf, 'new'));
		expect(deep.calls).to.deep.equal([{value: 'new', previous: 'old'}]);
		expect(ancestor.calls).to.deep.equal([{
			value: {c: {d: {e: 'new'}}},
			previous: {c: {d: {e: 'old'}}},
		}]);
		expect(sibling.calls).to.deep.equal([]);
	});

	it('notifies a same-branch listener at a random depth and ignores the other branch', () => {
		const random = mulberry32(0xB3A2);
		for (let trial = 0; trial < 40; trial++) {
			const changeDepth = 1 + Math.floor(random() * 10);
			const listenerDepth = 1 + Math.floor(random() * 10);
			const leaf = pathAtDepth(changeDepth, 'c');
			const listenerPath = pathAtDepth(listenerDepth, 'c');
			const otherPath = pathAtDepth(listenerDepth, 'o');
			const bus = new PublicTreeListeners();
			const listener = record();
			const other = record();
			const exact = record();
			bus.listen(listenerPath, listener.onChange);
			bus.listen(otherPath, other.onChange);
			bus.listen(leaf, exact.onChange);

			bus.apply(setPath({}, leaf, 1));
			bus.apply(setPath({}, leaf, 2));

			const label = `trial ${trial} listener ${listenerPath} leaf ${leaf}`;
			expect(exact.calls, label).to.have.length(1);
			expect(exact.calls[0], label).to.deep.equal({value: 2, previous: 1});
			expect(other.calls, label).to.deep.equal([]);
			// A path below a scalar leaf has no slice. A path at or above the leaf does.
			const expectListener = listenerDepth <= changeDepth;
			expect(listener.calls, label).to.have.length(expectListener ? 1 : 0);
			if (expectListener)
				expect(listener.calls[0].value, label).to.deep.equal(publicValueAt(setPath({}, leaf, 2), listenerPath));
		}
	});

	it('delivers a deep child when an ancestor object is replaced', () => {
		const random = mulberry32(0xD3E7);
		for (let trial = 0; trial < 20; trial++) {
			const ancestorDepth = 1 + Math.floor(random() * 4);
			const extra = 1 + Math.floor(random() * 5);
			const ancestor = pathAtDepth(ancestorDepth, 'p');
			const leaf = `${ancestor}/${pathAtDepth(extra, 'k')}`;
			const before = setPath({}, leaf, 'one');
			const after = setPath({}, leaf, 'two');
			const bus = new PublicTreeListeners();
			const parent = record();
			const child = record();
			const beside = record();
			bus.listen(ancestor, parent.onChange);
			bus.listen(leaf, child.onChange);
			bus.listen(`${ancestor}/other`, beside.onChange);
			bus.apply(before);
			bus.apply(after);

			const label = `trial ${trial} ${leaf}`;
			expect(child.calls, label).to.deep.equal([{value: 'two', previous: 'one'}]);
			expect(parent.calls, label).to.have.length(1);
			expect(parent.calls[0].value, label).to.deep.equal(publicValueAt(after, ancestor));
			expect(beside.calls, label).to.deep.equal([]);
		}
	});

	it('replays the current slice once when a listener joins after the seed', () => {
		const random = mulberry32(0x51);
		for (let depth = 1; depth <= 8; depth++) {
			const path = pathAtDepth(depth, 'r');
			const tree = setPath({}, path, depth);
			const bus = new PublicTreeListeners();
			bus.apply(tree);
			const joined = record();
			bus.listen(path, joined.onChange);
			expect(joined.calls, path).to.deep.equal([{value: depth, previous: undefined}]);

			const unrelated = pathAtDepth(1 + Math.floor(random() * 6), 'u');
			bus.apply(setPath(tree, unrelated, true));
			expect(joined.calls, path).to.have.length(1);
		}
	});

	it('stops a deep listener when it unsubscribes', () => {
		const path = pathAtDepth(7, 'u');
		const bus = new PublicTreeListeners();
		const deep = record();
		const stop = bus.listen(path, deep.onChange);
		bus.apply(setPath({}, path, 1));
		stop();
		bus.apply(setPath({}, path, 2));
		expect(deep.calls).to.deep.equal([]);
	});

	it('calls each listener once when two branches change in one snapshot', () => {
		const left = pathAtDepth(3, 'l');
		const right = pathAtDepth(6, 'r');
		const before = setPath(setPath({}, left, 1), right, 1);
		const after = setPath(setPath({}, left, 2), right, 3);
		const bus = new PublicTreeListeners();
		const leftListener = record();
		const rightListener = record();
		const belowRight = record();
		bus.listen(pathAtDepth(1, 'l'), leftListener.onChange);
		bus.listen(pathAtDepth(4, 'r'), rightListener.onChange);
		bus.listen(`${right}/extra/deeper`, belowRight.onChange);
		bus.apply(before);
		bus.apply(after);

		expect(leftListener.calls).to.have.length(1);
		expect(rightListener.calls).to.have.length(1);
		expect(belowRight.calls).to.deep.equal([]);
		expect(leftListener.calls[0].previous).to.deep.equal(publicValueAt(before, 'l0'));
		expect(rightListener.calls[0].value).to.deep.equal(publicValueAt(after, pathAtDepth(4, 'r')));
	});
});
