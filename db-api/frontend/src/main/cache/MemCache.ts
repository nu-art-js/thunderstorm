/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {arrayToMap, BadImplementationException, sortArray, TypedMap} from '@nu-art/ts-common';
import {composeDbObjectUniqueId, DB_Object, dbObjectToId} from '../to-refactor/index.js';


/**
 * In-memory cache for database entities.
 *
 * Provides fast, synchronous access to cached data with support for
 * filtering, mapping, and unique lookups. Data is stored as frozen
 * objects to prevent accidental mutations.
 *
 * @template Proto - Database prototype type
 */
export class MemCache<ItemType extends object, UniqueParams extends (keyof ItemType)[]> {

	private readonly keys: UniqueParams;
	loaded: boolean = false;

	private _map!: Readonly<TypedMap<Readonly<ItemType>>>;
	_array!: Readonly<Readonly<ItemType>[]>;

	protected cacheFilter?: (item: Readonly<ItemType>) => boolean;

	constructor(keys: UniqueParams) {
		this.keys = keys;
		this.clear();
	}

	setCacheFilter = (filter: (item: Readonly<ItemType>) => boolean) => {
		this.cacheFilter = filter;
	};

	getCacheFilter = () => this.cacheFilter;

	forEach = (processor: (item: Readonly<ItemType>) => void) => {
		this._array.forEach(processor);
	};

	clear = () => {
		this.setCache([]);
		this.loaded = false;
	};

	/**
	 * Load items into cache.
	 *
	 * @param items - Items to cache (will be frozen)
	 */
	load(items: ItemType[]) {
		const frozenItems = items.map(item => Object.freeze(item));
		this.setCache(frozenItems);
		this.loaded = true;
	}

	uniqueAssert = (_key?: UniqueParams): Readonly<ItemType> => {
		const item = this.unique(_key);
		if (!item)
			throw new BadImplementationException(`Missing expected item for keys: ${JSON.stringify(_key)}`);

		return item;
	};

	unique = (_key?: UniqueParams): Readonly<ItemType> | undefined => {
		if (_key === undefined)
			return _key;

		const _id = typeof _key === 'string'
			? _key
			: (('_id' in (_key as { [p: string]: any }) && typeof _key['_id'] === 'string')
				? _key['_id']
				: composeDbObjectUniqueId(_key, this.keys));
		return this._map[_id];
	};

	all = (): Readonly<Readonly<ItemType>[]> => {
		return this._array;
	};

	allMutable = (): Readonly<ItemType>[] => {
		return [...this._array];
	};

	filter = (filter: (item: Readonly<ItemType>, index: number, array: Readonly<ItemType[]>) => boolean): Readonly<ItemType>[] => {
		return this.all().filter(filter);
	};

	byIds = (ids: UniqueParams[]): (Readonly<ItemType> | undefined)[] => {
		return ids.map(id => this.unique(id));
	};

	find = (filter: (item: Readonly<ItemType>, index: number, array: Readonly<ItemType[]>) => boolean): Readonly<ItemType> | undefined => {
		return this.all().find(filter);
	};

	map = <MapType>(mapper: (item: Readonly<ItemType>, index: number, array: Readonly<ItemType[]>) => MapType): MapType[] => {
		return this.all().map(mapper);
	};

	sort = (map: keyof ItemType | UniqueParams | ((item: Readonly<ItemType>) => any) = i => i, invert = false): Readonly<ItemType>[] => {
		return sortArray(this.allMutable(), map, invert);
	};

	arrayToMap = (getKey: (item: Readonly<ItemType>, index: number, map: {
		[k: string]: Readonly<ItemType>
	}) => string | number, map: {
		[k: string]: Readonly<ItemType>
	} = {}) => arrayToMap(this.allMutable(), getKey, map);

	/**
	 * Update cache after entries are deleted.
	 */
	onEntriesDeleted(itemsDeleted: ItemType[]) {
		const ids = new Set<string>(itemsDeleted.map(dbObjectToId));
		this.setCache(this.filter(i => !ids.has(i._id)));
	}

	/**
	 * Update cache after entries are updated/created.
	 */
	onEntriesUpdated(itemsUpdated: ItemType[]) {
		const frozenItems = itemsUpdated.map(item => Object.freeze(item));
		const ids = new Set<string>(itemsUpdated.map(dbObjectToId));
		const toCache = this.filter(i => !ids.has(i._id));
		toCache.push(...frozenItems);
		this.setCache(toCache);
	}

	protected setCache(cacheArray: Readonly<ItemType>[]) {
		this._map = Object.freeze({...arrayToMap(cacheArray as Readonly<DB_Object>[], dbObjectToId)});
		this._array = Object.freeze(cacheArray);
	}
}
