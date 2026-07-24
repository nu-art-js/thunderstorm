/*
 * @nu-art/db-api-shared — version upgrade processor helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type VersionUpgradeItemProcessor<T> = (item: T) => void | Promise<void>;

export type VersionUpgradeBatchProcessor<T> = (items: T[]) => Promise<void>;

/** Wrap a per-item upgrade step as the batch processor `registerVersionUpgradeProcessor` expects. */
export function defineVersionUpgradeProcessor<T>(
	itemProcessor: VersionUpgradeItemProcessor<T>,
): VersionUpgradeBatchProcessor<T> {
	return async (items) => {
		for (const item of items)
			await itemProcessor(item);
	};
}
