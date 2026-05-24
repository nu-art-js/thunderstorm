/*
 * ts-common - Core TypeScript infrastructure
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */


type CacheEntry<T> = { value: T; cachedAt: number };

/**
 * TTL-based in-memory cache with keyed entries.
 *
 * Each entry expires independently after the configured TTL.
 * Supports explicit invalidation of individual entries or the entire cache.
 *
 * @template T - Cached value type
 */
export class CacheKey<T> {

	private readonly entries = new Map<string, CacheEntry<T>>();

	constructor(readonly key: string, private readonly ttlMs: number) {
	}

	get(entryKey: string): T | undefined {
		const entry = this.entries.get(entryKey);
		if (!entry)
			return undefined;

		if (Date.now() - entry.cachedAt > this.ttlMs) {
			this.entries.delete(entryKey);
			return undefined;
		}

		return entry.value;
	}

	set(entryKey: string, value: T): T {
		this.entries.set(entryKey, {value, cachedAt: Date.now()});
		return value;
	}

	invalidate(entryKey?: string): void {
		if (entryKey !== undefined)
			this.entries.delete(entryKey);
		else
			this.entries.clear();
	}
}
