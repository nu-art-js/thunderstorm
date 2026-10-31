/*
 * @nu-art/git-like-shared - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {GitLike_ViewDelta} from './view.js';

export type GitLike_DeltaApiResponse<T extends {_id: string} = {_id: string}> = {
	branchId?: string;
	deltas: GitLike_ViewDelta<T>[];
};
