/*
 * @nu-art/git-like-backend - Git-like branching of live collections
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_GitLike_DeltaDB} from './ModuleBE_GitLike_DeltaDB.js';

export const ModulePackBE_GitLike_Delta = [ModuleBE_GitLike_DeltaDB, createApisForDBModule(ModuleBE_GitLike_DeltaDB)];
