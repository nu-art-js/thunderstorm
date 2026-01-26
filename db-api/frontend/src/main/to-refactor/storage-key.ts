/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: This should come from a browser-storage package.
 */


type ChangeListener<T> = (after?: T, before?: T) => void | Promise<void>;

/**
 * Type-safe localStorage wrapper with change listeners.
 */
export class StorageKey<T> {
	private readonly key: string;
	private listeners: ChangeListener<T>[] = [];

	constructor(key: string) {
		this.key = key;
	}

	/**
	 * Get the stored value, or default if not set.
	 */
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

	/**
	 * Set a new value and notify listeners.
	 */
	set(value: T): void {
		const before = this.get();
		localStorage.setItem(this.key, JSON.stringify(value));
		this.notifyListeners(value, before);
	}

	/**
	 * Delete the stored value and notify listeners.
	 */
	delete(): void {
		const before = this.get();
		localStorage.removeItem(this.key);
		this.notifyListeners(undefined, before);
	}

	/**
	 * Register a change listener.
	 */
	onChange(listener: ChangeListener<T>): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove a change listener.
	 */
	offChange(listener: ChangeListener<T>): void {
		this.listeners = this.listeners.filter(l => l !== listener);
	}

	private notifyListeners(after?: T, before?: T): void {
		this.listeners.forEach(listener => {
			try {
				listener(after, before);
			} catch (e) {
				console.error('StorageKey listener error:', e);
			}
		});
	}
}
