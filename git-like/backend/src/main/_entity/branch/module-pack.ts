/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_GitLike_BranchDB} from './ModuleBE_GitLike_BranchDB.js';

export const ModulePackBE_GitLike_Branch = [ModuleBE_GitLike_BranchDB, createApisForDBModule(ModuleBE_GitLike_BranchDB)];
