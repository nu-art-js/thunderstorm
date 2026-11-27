/*
 * @nu-art/ts-messaging-shared — per-topic message write scope
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_PermissionScope} from '@nu-art/permissions-shared';

/**
 * The scope string a caller must hold to post on one topic.
 * Example: `topicWriteScopeToken('topic-1')` is `topic-1:write`.
 */
export const topicWriteScopeToken = (topicId: string): string =>
	`${topicId}:write`;

/**
 * Scope row id for `topicWriteScopeToken`.
 * Example: `topicWriteScopeId('topic-1')` is the hash of `topic-1:write`.
 */
export const topicWriteScopeId = (topicId: string): DatabaseDef_PermissionScope['id'] =>
	hashToUniqueId<DatabaseDef_PermissionScope['dbKey']>(topicWriteScopeToken(topicId));
