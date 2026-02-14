/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

type ChangeListener<T> = (after?: T, before?: T) => void | Promise<void>;

/**
 * Minimal localStorage wrapper with change listeners (for UI persistence, e.g. tab selection).
 */
export class StorageKey<T> {
	private readonly key: string;
	private readonly listeners: ChangeListener<T>[] = [];

	constructor(key: string) {
		this.key = key;
	}

	get(defaultValue?: T): T | undefined {
		try {
			const item = localStorage.getItem(this.key);
			if (item === null)
				return defaultValue;
			return JSON.parse(item) as T;
		} catch {
			return defaultValue;
		}
	}

	set(value: T): void {
		const before = this.get();
		localStorage.setItem(this.key, JSON.stringify(value));
		this.listeners.forEach(l => {
			try {
				l(value, before);
			} catch (e) {
				console.error('StorageKey listener error:', e);
			}
		});
	}

	delete(): void {
		const before = this.get();
		localStorage.removeItem(this.key);
		this.listeners.forEach(l => {
			try {
				l(undefined, before);
			} catch (e) {
				console.error('StorageKey listener error:', e);
			}
		});
	}

	onChange(listener: ChangeListener<T>): void {
		this.listeners.push(listener);
	}
}
