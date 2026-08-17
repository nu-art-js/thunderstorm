/*
 * @nu-art/ts-messaging-shared — mention tokens in message text
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {dbIdLength} from '@nu-art/ts-common';
import type {DB_Account} from '@nu-art/user-account-shared';

/**
 * Directed-ask token written into Message.text after the UI resolves `@name`.
 * Backend parse is the only source of explicit mentions — never trust client `mention[]`.
 *
 * Do not treat `@name` as a mention here. Display names are not stable and are not an allow-list.
 */
export function formatMessageMentionToken(accountId: DB_Account['_id'] | string): string {
	return `@_id(${accountId})`;
}

/**
 * Extract claimed account ids from `@_id(<32-hex>)` tokens.
 * Claims are not authorization — `resolveCreateMentions` must intersect with topic writers.
 */
export function parseMessageMentionIds(text?: string): string[] {
	if (!text)
		return [];

	const ids: string[] = [];
	const seen = new Set<string>();
	const pattern = new RegExp(`@_id\\(([0-9a-f]{${dbIdLength}})\\)`, 'g');
	for (const match of text.matchAll(pattern)) {
		const id = match[1];
		if (seen.has(id))
			continue;
		seen.add(id);
		ids.push(id);
	}
	return ids;
}
