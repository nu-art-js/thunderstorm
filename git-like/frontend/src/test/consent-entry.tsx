/*
 * @nu-art/git-like-frontend - Merge consent screen test page
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createRoot} from 'react-dom/client';
import {gitLikeConsentContent, gitLikeConsentScreen} from '@nu-art/git-like-shared/consent';
import {composeGitLikeView} from '@nu-art/git-like-shared/view';
import {GitLike_ConsentScreen} from '../main/GitLike_ConsentScreen.js';

const collection = 'collection-x';
const deltas = [
	{docId: 'doc-1', tombstone: false, origin: {label: 'Live title'}, document: {_id: 'doc-1', label: 'Edited on the branch'}},
	{docId: 'doc-2', tombstone: false, document: {_id: 'doc-2', label: 'Added on the branch'}},
	{docId: 'doc-3', tombstone: true, origin: {_id: 'doc-3', label: 'Will leave'}},
];
const live = [
	{_id: 'doc-1', label: 'Live title'},
	{_id: 'doc-3', label: 'Will leave'},
];
const screen = gitLikeConsentScreen('design', collection, deltas);
const after = composeGitLikeView(live, deltas.map(delta => ({
	docId: delta.docId,
	tombstone: delta.tombstone,
	document: delta.document,
})));

declare global {
	interface Window {
		TestReady: boolean;
		ConsentContent: string;
		ConsentPressed: string;
	}
}

window.ConsentContent = gitLikeConsentContent(screen);
window.ConsentPressed = '';
const root = document.getElementById('test-root');
if (root)
	createRoot(root).render(
		<GitLike_ConsentScreen
			branchLabel={screen.branchLabel}
			changes={screen.changes}
			after={after}
			onCreate={() => {
				window.ConsentPressed = 'create';
			}}
			onBind={() => {
				window.ConsentPressed = 'bind';
			}}
			onReview={() => {
				window.ConsentPressed = 'review';
			}}
			onMerge={() => {
				window.ConsentPressed = 'merge';
			}}
		/>,
	);
window.TestReady = true;
