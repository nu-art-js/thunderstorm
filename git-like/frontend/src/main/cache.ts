/*
 * @nu-art/git-like-frontend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {composeGitLikeView} from '@nu-art/git-like-shared/view';
import type {GitLike_ViewDelta} from '@nu-art/git-like-shared/view';

export type GitLike_CacheModule<T extends {_id: string}> = {
	loadCache: () => Promise<void>;
	cache: {
		all: () => T[];
		load: (items: T[]) => void;
	};
};

export function installGitLikeCache<T extends {_id: string}>(
	module: GitLike_CacheModule<T>,
	readDeltas: () => Promise<readonly GitLike_ViewDelta<T>[]>,
) {
	const loadLive = module.loadCache.bind(module);
	module.loadCache = async () => {
		await loadLive();
		module.cache.load(composeGitLikeView(module.cache.all(), await readDeltas()));
	};
}
