/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export class StorageKey<ValueType = string | number | object> {
	readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	get(): ValueType | undefined {
		const value = localStorage.getItem(this.key);
		if (!value)
			return undefined;
		try {
			return JSON.parse(value) as ValueType;
		} catch {
			return undefined;
		}
	}

	set(value: ValueType): void {
		localStorage.setItem(this.key, JSON.stringify(value));
	}

	delete(): void {
		localStorage.removeItem(this.key);
	}
}
