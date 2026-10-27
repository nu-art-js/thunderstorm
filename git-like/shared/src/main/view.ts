/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type GitLike_ViewDelta<T extends {_id: string} = {_id: string}> = {
	docId: string;
	tombstone: boolean;
	document?: T;
};

export function composeGitLikeView<T extends {_id: string}>(
	live: readonly T[],
	deltas: readonly GitLike_ViewDelta<T>[],
): T[] {
	const byId = new Map(live.map(doc => [doc._id, doc]));
	for (const delta of deltas) {
		if (delta.tombstone) {
			byId.delete(delta.docId);
			continue;
		}
		if (delta.document)
			byId.set(delta.docId, delta.document);
	}
	return [...byId.values()];
}
