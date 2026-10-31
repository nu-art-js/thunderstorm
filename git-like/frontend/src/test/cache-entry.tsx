/*
 * @nu-art/git-like-frontend - Delta API cache test page
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createRoot} from 'react-dom/client';
import type {GitLike_DeltaApiResponse} from '@nu-art/git-like-shared/delta-api';
import {GitLike_BranchView} from '../main/GitLike_BranchView.js';
import {installGitLikeCache} from '../main/cache.js';

type Row = {_id: string; label: string};

const live: Row[] = [
	{_id: 'doc-1', label: 'Live title'},
];

const branchK: GitLike_DeltaApiResponse<Row> = {
	branchId: 'k'.repeat(32),
	deltas: [{
		docId: 'doc-1',
		tombstone: false,
		document: {_id: 'doc-1', label: 'Edited on the branch'},
	}],
};
const branchM: GitLike_DeltaApiResponse<Row> = {
	branchId: 'm'.repeat(32),
	deltas: [{
		docId: 'doc-1',
		tombstone: false,
		document: {_id: 'doc-1', label: 'Other branch'},
	}],
};

let current = branchK;
const items: Row[] = [];
const module = {
	cache: {
		all: () => items,
		load: (next: Row[]) => {
			items.splice(0, items.length, ...next);
		},
	},
	loadCache: async () => {
		items.splice(0, items.length, ...live.map(row => ({...row})));
	},
};

await installGitLikeCache(module, async () => current);

const rootEl = document.getElementById('test-root');
const root = rootEl ? createRoot(rootEl) : undefined;

async function show() {
	await module.loadCache();
	window.GitLikeRows = module.cache.all();
	root?.render(<GitLike_BranchView branchLabel={current === branchK ? 'design' : 'other'} rows={window.GitLikeRows}/>);
}

declare global {
	interface Window {
		TestReady: boolean;
		GitLikeRows: Row[];
		SwitchBranch: () => Promise<void>;
	}
}

window.SwitchBranch = async () => {
	current = branchM;
	await show();
};

await show();
window.TestReady = true;
