/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {DatabaseDef_GitLike_Branch} from '@nu-art/git-like-shared';
import {DBDef_GitLike_Branch} from '@nu-art/git-like-shared';
import {MemKey_GitLike_BranchId} from '../../consts.js';

export class ModuleBE_GitLike_BranchDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_GitLike_Branch> {

	constructor() {
		super(DBDef_GitLike_Branch);
	}

	/**
	 * The branch for this request. Unset means live.
	 * peak is the absence check: no active branch is a real state, not a missing context.
	 */
	activeBranchId(): DatabaseDef_GitLike_Branch['id'] | undefined {
		return MemKey_GitLike_BranchId.peak();
	}

	enter(branchId: DatabaseDef_GitLike_Branch['id']): void {
		MemKey_GitLike_BranchId.set(branchId);
	}
}

export const ModuleBE_GitLike_BranchDB = new ModuleBE_GitLike_BranchDB_Class();
