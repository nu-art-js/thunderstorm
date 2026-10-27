/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type GitLike_ChangeKind = 'replace' | 'add' | 'tombstone';

export type GitLike_ConsentChange = {
	collection: string;
	docId: string;
	kind: GitLike_ChangeKind;
	label?: string;
};

export type GitLike_ConsentScreenData = {
	branchLabel: string;
	changes: GitLike_ConsentChange[];
};

export function gitLikeChangeKind(delta: {tombstone: boolean; origin?: unknown}): GitLike_ChangeKind {
	if (delta.tombstone)
		return 'tombstone';
	if (delta.origin === undefined)
		return 'add';
	return 'replace';
}

export function gitLikeConsentScreen(
	branchLabel: string,
	collection: string,
	deltas: readonly {docId: string; tombstone: boolean; origin?: unknown; document?: {label?: unknown}}[],
): GitLike_ConsentScreenData {
	return {
		branchLabel,
		changes: deltas.map(delta => {
			const label = delta.document?.label;
			return {
				collection,
				docId: delta.docId,
				kind: gitLikeChangeKind(delta),
				label: typeof label === 'string' ? label : undefined,
			};
		}),
	};
}

/** Words for the model. The page uses GitLike_ConsentScreenData, not this string. */
export function gitLikeConsentContent(screen: GitLike_ConsentScreenData): string {
	const lines = [`Branch ${screen.branchLabel}`];
	for (const change of screen.changes) {
		const label = change.label ? ` ${change.label}` : '';
		lines.push(`${change.collection} ${change.docId} ${change.kind}${label}`);
	}
	return lines.join('\n');
}
