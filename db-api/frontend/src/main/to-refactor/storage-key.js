/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: This should come from a browser-storage package.
 */
/**
 * Type-safe localStorage wrapper with change listeners.
 */
export class StorageKey {
    key;
    listeners = [];
    constructor(key) {
        this.key = key;
    }
    /**
     * Get the stored value, or default if not set.
     */
    get(defaultValue) {
        try {
            const item = localStorage.getItem(this.key);
            if (item === null)
                return defaultValue;
            return JSON.parse(item);
        }
        catch {
            return defaultValue;
        }
    }
    /**
     * Set a new value and notify listeners.
     */
    set(value) {
        const before = this.get();
        localStorage.setItem(this.key, JSON.stringify(value));
        this.notifyListeners(value, before);
    }
    /**
     * Delete the stored value and notify listeners.
     */
    delete() {
        const before = this.get();
        localStorage.removeItem(this.key);
        this.notifyListeners(undefined, before);
    }
    /**
     * Register a change listener.
     */
    onChange(listener) {
        this.listeners.push(listener);
    }
    /**
     * Remove a change listener.
     */
    offChange(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    notifyListeners(after, before) {
        this.listeners.forEach(listener => {
            try {
                listener(after, before);
            }
            catch (e) {
                console.error('StorageKey listener error:', e);
            }
        });
    }
}
//# sourceMappingURL=storage-key.js.map