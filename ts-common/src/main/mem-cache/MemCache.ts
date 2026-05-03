/*
 * ts-common - Core TypeScript infrastructure
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {arrayToMap, sortArray} from '../utils/array-tools.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {TypedMap} from '../utils/types.js';


/** Key reference for lookup: string id or partial object to resolve via keyToId */
export type MemCacheKeyRef = string | Record<string, unknown>;

/**
 * Options for constructing a MemCache. Id extraction is pluggable; no DB or domain types.
 */
export type MemCacheOptions<T extends object> = {
	/** Extracts a stable string id from an item. Used for map storage and delta updates. */
	getId: (item: T) => string;
	/** Resolves a lookup key (string or partial object) to id. Omit if lookups are always by string id. */
	keyToId?: (key: MemCacheKeyRef) => string;
};

/**
 * In-memory cache with pluggable id extraction.
 *
 * Provides fast, synchronous access with filtering, mapping, unique lookups, and delta updates.
 * Items are stored frozen. No dependency on DB or Proto; app provides getId/keyToId.
 *
 * @template T - Item type
 */
export class MemCache<T extends object> {

	private readonly getId: (item: T) => string;
	private readonly keyToId: ((key: MemCacheKeyRef) => string) | undefined;

	loaded = false;

	private _map!: Readonly<TypedMap<Readonly<T>>>;
	private _array!: Readonly<Readonly<T>[]>;

	protected cacheFilter?: (item: Readonly<T>) => boolean;

	constructor(options: MemCacheOptions<T>) {
		this.getId = options.getId;
		this.keyToId = options.keyToId;
		this.clear();
	}

	setCacheFilter = (filter: (item: Readonly<T>) => boolean) => {
		this.cacheFilter = filter;
	};

	getCacheFilter = () => this.cacheFilter;

	forEach = (processor: (item: Readonly<T>) => void) => {
		this._array.forEach(processor);
	};

	clear = () => {
		this.setCache([]);
		this.loaded = false;
	};

	/**
	 * Load items into cache. Items are frozen.
	 */
	load(items: T[]) {
		const frozen = items.map(item => Object.freeze(item) as Readonly<T>);
		this.setCache(frozen);
		this.loaded = true;
	}

	private resolveKey(key: MemCacheKeyRef): string | undefined {
		if (typeof key === 'string')
			return key;
		if (this.keyToId)
			return this.keyToId(key);
		return undefined;
	}

	uniqueAssert = (key?: MemCacheKeyRef): Readonly<T> => {
		const item = this.unique(key);
		if (!item)
			throw new BadImplementationException(`Missing expected item for keys: ${JSON.stringify(key)}`);

		return item;
	};

	unique = (key?: MemCacheKeyRef): Readonly<T> | undefined => {
		if (key === undefined)
			return undefined;

		const id = this.resolveKey(key);
		return id !== undefined ? this._map[id] : undefined;
	};

	all = (): Readonly<Readonly<T>[]> => this._array;

	allMutable = (): Readonly<T>[] => [...this._array];

	filter = (filter: (item: Readonly<T>, index: number, array: Readonly<T[]>) => boolean): Readonly<T>[] =>
		this.all().filter(filter as (item: Readonly<T>, index: number, array: Readonly<Readonly<T>[]>) => boolean);

	byIds = (ids: MemCacheKeyRef[]): (Readonly<T> | undefined)[] =>
		ids.map(id => this.unique(id));

	find = (filter: (item: Readonly<T>, index: number, array: Readonly<T[]>) => boolean): Readonly<T> | undefined =>
		this.all().find(filter as (item: Readonly<T>, index: number, array: Readonly<Readonly<T>[]>) => boolean);

	map = <U>(mapper: (item: Readonly<T>, index: number, array: Readonly<T[]>) => U): U[] =>
		this.all().map(mapper as (item: Readonly<T>, index: number, array: Readonly<Readonly<T>[]>) => U);

	sort = (map: keyof T | (keyof T)[] | ((item: Readonly<T>) => unknown) = (i: T) => i, invert = false): Readonly<T>[] =>
		sortArray(this.allMutable() as T[], map as keyof T | (keyof T)[] | ((item: T) => unknown), invert);

	arrayToMap = (
		getKey: (item: Readonly<T>, index: number, map: TypedMap<Readonly<T>>) => string | number | (string | number)[],
		map: TypedMap<Readonly<T>> = {}
	): TypedMap<Readonly<T>> =>
		arrayToMap(this.allMutable(), getKey as (item: T, index: number, map: TypedMap<T>) => string | number | (string | number)[], map as TypedMap<T>);

	/**
	 * Update cache after entries are deleted. Uses getId for identity.
	 */
	onEntriesDeleted(itemsDeleted: T[]) {
		const ids = new Set(itemsDeleted.map(this.getId));
		this.setCache(this.filter(i => !ids.has(this.getId(i as T))));
	}

	/**
	 * Update cache after entries are updated/created. Uses getId for identity.
	 */
	onEntriesUpdated(itemsUpdated: T[]) {
		const frozen = itemsUpdated.map(item => Object.freeze(item) as Readonly<T>);
		const ids = new Set(itemsUpdated.map(this.getId));
		const retained = this.filter(i => !ids.has(this.getId(i as T)));
		this.setCache(retained.concat(frozen as Readonly<T>[]));
	}

	protected setCache(cacheArray: Readonly<T>[]) {
		this._map = Object.freeze({...arrayToMap(cacheArray as T[], (item: T) => this.getId(item))} as TypedMap<Readonly<T>>);
		this._array = Object.freeze(cacheArray);
	}
}
