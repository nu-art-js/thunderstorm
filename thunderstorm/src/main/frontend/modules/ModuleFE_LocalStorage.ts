/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by tacb0ss on 27/07/2018.
 */
import {exists, merge, Module, TS_Object} from '@nu-art/ts-common';
import {ThunderDispatcher} from '../core/thunder-dispatcher';
import {OnClearWebsiteData} from './clearWebsiteDataDispatcher';


export interface StorageKeyEvent {
	__onStorageKeyEvent(event: StorageEvent): void;
}

export class StorageModule_Class
	extends Module
	implements OnClearWebsiteData {
	private cache: { [s: string]: string | number | object } = {};
	private keys: StorageKey[] = [];

	protected init(): void {
		window.addEventListener('storage', this.handleStorageEvent);
	}

	async __onClearWebsiteData(resync: boolean) {
		const items = this.keys.map(key => key.get());
		localStorage.clear();
		this.keys.forEach((key, index) => key.set(items[index]));
	}

	private handleStorageEvent = (e: StorageEvent) => {
		const dispatcher = new ThunderDispatcher<StorageKeyEvent, '__onStorageKeyEvent'>('__onStorageKeyEvent');
		dispatcher.dispatchUI(e);
		dispatcher.dispatchModule(e);
	};

	getStorage = (persist: boolean) => persist ? localStorage : sessionStorage;

	set(key: string, value: string | number | object, persist: boolean = true) {
		if (value === undefined)
			return this.delete(key);

		this.cache[key] = value;
		this.getStorage(persist).setItem(key, JSON.stringify(value));
	}

	delete(key: string, persist: boolean = true) {
		this.clearCache(key);
		this.getStorage(persist).removeItem(key);
	}

	clearCache(key: string) {
		delete this.cache[key];
	}

	public get(key: string, defaultValue?: string | number | object, persist: boolean = true): string | number | object | undefined {
		let value: string | number | object | null = this.cache[key];
		if (value)
			return value;

		value = this.getStorage(persist).getItem(key);
		// this.logDebug(`get: ${key} = ${value}`)
		if (!exists(value) || value === 'null' || value === 'undefined')
				return defaultValue;

		return this.cache[key] = JSON.parse(value!);
	}

	public query<T>(query: RegExp): T[] {
		const toRet: T[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.match(query)) {
				const item = localStorage.getItem(key);
				if (item) {
					try {
						const exp = JSON.parse(item);
						toRet.push(exp);
					} catch (e: any) {
						this.logError(e);
					}
				}
			}
		}
		return toRet;
	}

	public deleteAll<T>(query: RegExp) {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.match(query)) {
				localStorage.removeItem(key);
			}
		}
	}

	addKey(storageKey: StorageKey<any>) {
		this.keys.push(storageKey);
	}
}

export const ModuleFE_LocalStorage = new StorageModule_Class();

//TODO Generic Keys like in the tests contexts
export class StorageKey<ValueType = string | number | object> {
	private readonly key: string;
	private readonly persist: boolean;

	constructor(key: string, persist: boolean = true) {
		this.key = key;
		this.persist = persist;
	}

	withstandDeletion() {
		ModuleFE_LocalStorage.addKey(this);
		return this;
	}

	get(defaultValue?: ValueType): ValueType {
		// @ts-ignore
		return ModuleFE_LocalStorage.get(this.key, defaultValue, this.persist) as unknown as ValueType;
	}

	patch(value: ValueType extends TS_Object ? Partial<ValueType> : ValueType) {
		const previousValue = this.get();
		const mergedValue = merge(previousValue, value);
		this.set(mergedValue);
		return mergedValue;
	}

	set(value: ValueType) {
		// @ts-ignore
		ModuleFE_LocalStorage.set(this.key, value, this.persist);
		// console.log('StorageKey', this.key);
		return value;
	}

	delete() {
		ModuleFE_LocalStorage.delete(this.key, this.persist);
	}

	clearCache() {
		ModuleFE_LocalStorage.clearCache(this.key);
	}
}

