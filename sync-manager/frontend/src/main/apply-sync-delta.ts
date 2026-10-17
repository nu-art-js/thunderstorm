/*
 * @nu-art/sync-manager-frontend — Apply a request write set onto frontend db modules
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MUSTNeverHappenException, type DB_Object} from '@nu-art/ts-common';
import type {SyncDelta} from '@nu-art/sync-manager-shared';

export type SyncDeltaTarget = {
	onEntriesUpdated: (items: DB_Object[]) => Promise<void>;
	onEntriesDeleted: (items: DB_Object[]) => Promise<void>;
};

export const applySyncDelta = async (
	delta: SyncDelta,
	findModule: (dbKey: string) => SyncDeltaTarget | undefined,
): Promise<void> => {
	for (const entry of delta) {
		const module = findModule(entry.dbKey);
		if (!module)
			throw new MUSTNeverHappenException(`Trying to apply a written delta without an existing rtModule: ${entry.dbKey}`);

		if (entry.toUpdate.length)
			await module.onEntriesUpdated(entry.toUpdate);
		if (entry.toDelete.length)
			await module.onEntriesDeleted(entry.toDelete);
	}
};
