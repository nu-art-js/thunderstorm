/*
 * @nu-art/git-like-frontend - Branch view test page
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createRoot} from 'react-dom/client';
import {GitLike_BranchView} from '../main/GitLike_BranchView.js';
import {installGitLikeCache} from '../main/cache.js';

type Row = {_id: string; label: string};

const live: Row[] = [
	{_id: 'doc-1', label: 'Live title'},
	{_id: 'doc-3', label: 'Will leave'},
];

const deltas = [
	{docId: 'doc-1', tombstone: false, document: {_id: 'doc-1', label: 'Edited on the branch'}},
	{docId: 'doc-2', tombstone: false, document: {_id: 'doc-2', label: 'Added on the branch'}},
	{docId: 'doc-3', tombstone: true},
];

const items = live.map(row => ({...row}));
const module = {
	cache: {
		all: () => items,
		load: (next: Row[]) => {
			items.splice(0, items.length, ...next);
		},
	},
	loadCache: async () => {
	},
};

await installGitLikeCache(module, async () => ({deltas}));
await module.loadCache();

declare global {
	interface Window {
		TestReady: boolean;
		GitLikeRows: Row[];
	}
}

window.GitLikeRows = module.cache.all();
const root = document.getElementById('test-root');
if (root)
	createRoot(root).render(<GitLike_BranchView branchLabel="design" rows={window.GitLikeRows}/>);
window.TestReady = true;
