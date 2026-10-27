/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {DatabaseDef_GitLike_Delta} from '@nu-art/git-like-shared';
import {DBDef_GitLike_Delta} from '@nu-art/git-like-shared';

export class ModuleBE_GitLike_DeltaDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_GitLike_Delta> {

	constructor() {
		super(DBDef_GitLike_Delta);
	}
}

export const ModuleBE_GitLike_DeltaDB = new ModuleBE_GitLike_DeltaDB_Class();
