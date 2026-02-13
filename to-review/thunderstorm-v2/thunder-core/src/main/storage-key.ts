/*
 * @nu-art/thunder-core - Shallow localStorage wrapper
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Minimal localStorage get/set wrapper. No listeners, no sessionStorage.
 */
export class StorageKey<T> {
	private readonly key: string;

	constructor(key: string, _persist?: boolean) {
		this.key = key;
	}

	get(fallbackValue?: T): T | undefined {
		try {
			const item = localStorage.getItem(this.key);
			if (item === null)
				return fallbackValue;
			return JSON.parse(item) as T;
		} catch {
			return fallbackValue;
		}
	}

	set(value: T): void {
		localStorage.setItem(this.key, JSON.stringify(value));
	}
}
