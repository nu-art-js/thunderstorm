/*
 * @nu-art/sync-manager-backend — Pause RTDB sync stamps for a bulk rewrite
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';

/** True while a bulk rewrite must not move the RTDB sync clock on every write. */
export const MemKey_SyncNotificationsSuppressed = new MemKey<boolean>('sync-manager--notifications-suppressed');

export const syncNotificationsSuppressed = (): boolean =>
	MemKey_SyncNotificationsSuppressed.get(false);

export type SyncWriteEffect = {
	stampUpdated: boolean;
	recordDeleted: boolean;
	stampDeleted: boolean;
	stampWiped: boolean;
};

/** RTDB stamps stay off while notifications are suppressed. Deleted rows still record. */
export function syncWriteEffect(input: {
	suppressed: boolean;
	hasUpdated: boolean;
	hasDeleted: boolean;
	wiped: boolean;
}): SyncWriteEffect {
	if (input.wiped)
		return {
			stampUpdated: false,
			recordDeleted: false,
			stampDeleted: false,
			stampWiped: !input.suppressed,
		};

	return {
		stampUpdated: input.hasUpdated && !input.suppressed,
		recordDeleted: input.hasDeleted,
		stampDeleted: input.hasDeleted && !input.suppressed,
		stampWiped: false,
	};
}

export async function withSyncNotificationsSuppressed<T>(body: () => Promise<T>): Promise<T> {
	const previous = MemKey_SyncNotificationsSuppressed.get(false);
	MemKey_SyncNotificationsSuppressed.set(true);
	try {
		return await body();
	} finally {
		MemKey_SyncNotificationsSuppressed.set(previous);
	}
}
