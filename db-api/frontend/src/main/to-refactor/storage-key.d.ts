type ChangeListener<T> = (after?: T, before?: T) => void | Promise<void>;
/**
 * Type-safe localStorage wrapper with change listeners.
 */
export declare class StorageKey<T> {
    private readonly key;
    private listeners;
    constructor(key: string);
    /**
     * Get the stored value, or default if not set.
     */
    get(defaultValue?: T): T | undefined;
    /**
     * Set a new value and notify listeners.
     */
    set(value: T): void;
    /**
     * Delete the stored value and notify listeners.
     */
    delete(): void;
    /**
     * Register a change listener.
     */
    onChange(listener: ChangeListener<T>): void;
    /**
     * Remove a change listener.
     */
    offChange(listener: ChangeListener<T>): void;
    private notifyListeners;
}
export {};
