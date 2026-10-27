/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {DatabaseDef_GitLike_Branch} from '@nu-art/git-like-shared';

/** Unset means live. Not an access id. */
export const MemKey_GitLike_BranchId = new MemKey<DatabaseDef_GitLike_Branch['id']>('git-like-branch-id');

/**
 * Opaque caller key for this request. Unset means the call stays live.
 * Beamz sets this from the chat id. GitLike does not know what a chat is.
 */
export const MemKey_GitLike_CallerKey = new MemKey<string>('git-like-caller-key');

/** Set only by the consent screen before create, bind, review, or merge. */
export const MemKey_GitLike_FromPage = new MemKey<true>('git-like-from-page');
