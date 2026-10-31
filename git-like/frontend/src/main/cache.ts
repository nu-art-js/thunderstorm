/*
 * @nu-art/git-like-frontend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {composeGitLikeView} from '@nu-art/git-like-shared/view';
import type {GitLike_DeltaApiResponse} from '@nu-art/git-like-shared/delta-api';

export type GitLike_CacheModule<T extends {_id: string}> = {
	loadCache: () => Promise<void>;
	cache: {
		all: () => T[];
		load: (items: T[]) => void;
	};
};

export function paintGitLikeDeltas<T extends {_id: string}>(
	module: GitLike_CacheModule<T>,
	live: readonly T[],
	response: GitLike_DeltaApiResponse<T>,
) {
	module.cache.load(composeGitLikeView(live, response.deltas));
}

/**
 * The original loadCache puts the live rows back.
 * This call then paints the delta API response for the current branch.
 */
export function installGitLikeCache<T extends {_id: string}>(
	module: GitLike_CacheModule<T>,
	readDeltaApi: () => Promise<GitLike_DeltaApiResponse<T>>,
) {
	const loadLive = module.loadCache.bind(module);
	module.loadCache = async () => {
		await loadLive();
		paintGitLikeDeltas(module, module.cache.all(), await readDeltaApi());
	};
}
