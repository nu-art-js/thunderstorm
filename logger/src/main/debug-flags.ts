/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogLevel, LogLevelOrdinal} from './types.js';


/**
 * Represents a debug flag that controls logging for a specific logger tag.
 *
 * Each DebugFlag controls two aspects of logging:
 * 1. **Enabled state**: Whether logging is active for this flag
 * 2. **Minimum log level**: The lowest log level that will be output
 *
 * DebugFlags are automatically registered with the DebugFlags singleton when created.
 * They are typically created automatically by Logger instances using the logger's tag.
 *
 * @example
 * ```typescript
 * // Created automatically by Logger
 * const logger = new Logger('MyService');
 * // logger._DEBUG_FLAG is a DebugFlag with key 'MyService'
 *
 * // Or manually
 * const flag = DebugFlags.createFlag('CustomTag', LogLevel.Debug);
 * flag.enable();
 * flag.setMinLevel(LogLevel.Warning);
 * ```
 */
export class DebugFlag {

	/** Default minimum log level for new debug flags */
	public static DefaultLogLevel = LogLevel.Info;
	/** Unique identifier for this debug flag (typically matches logger tag) */
	private readonly key: string;
	/** Minimum log level that will be output when this flag is enabled */
	private minLogLevel: LogLevel;

	/**
	 * Creates a new DebugFlag and automatically registers it with DebugFlags.
	 *
	 * @param key - Unique identifier for this flag
	 * @param minLogLevel - Minimum log level (defaults to DebugFlag.DefaultLogLevel)
	 */
	private constructor(key: string, minLogLevel: LogLevel = DebugFlag.DefaultLogLevel) {
		this.key = key;
		this.minLogLevel = minLogLevel;

		DebugFlags.add(this);
	}

	/**
	 * Sets the minimum log level for this flag.
	 *
	 * Only log messages at or above this level will be output when the flag is enabled.
	 *
	 * @param minLogLevel - Minimum log level (Verbose < Debug < Info < Warning < Error)
	 */
	setMinLevel(minLogLevel: LogLevel) {
		this.minLogLevel = minLogLevel;
	}

	/**
	 * Renames this debug flag (updates the key).
	 *
	 * Useful when a logger's tag changes. Updates the registration in DebugFlags.
	 *
	 * @param newKey - New key/identifier for this flag
	 */
	rename(newKey: string) {
		DebugFlags.rename(this.key, newKey);
	}

	/**
	 * Gets the unique key/identifier for this flag.
	 */
	getKey() {
		return this.key;
	}

	/**
	 * Enables or disables this debug flag.
	 *
	 * When disabled, all logging for this flag is suppressed regardless of log level.
	 * When enabled, logging is controlled by the minimum log level.
	 *
	 * @param enable - If true, enables the flag. If false, disables it. Defaults to true.
	 */
	enable(enable = true) {
		if (this.isEnabled() === enable)
			return;

		if (enable)
			this._enable();
		else
			this._disable();
	}

	/**
	 * Checks if this debug flag is currently enabled.
	 *
	 * @returns true if enabled, false otherwise
	 */
	isEnabled() {
		return DebugFlags.instance.ActiveDebugFlags.includes(this.key);
	}

	/**
	 * Checks if a log message at the given level should be output.
	 *
	 * Returns true if:
	 * - The flag is enabled, AND
	 * - The log level is at or above the minimum log level
	 *
	 * @param level - Log level to check
	 * @returns true if the message should be logged, false otherwise
	 */
	canLog(level: LogLevel) {
		return LogLevelOrdinal.indexOf(level) >= LogLevelOrdinal.indexOf(this.minLogLevel);
	}

	/**
	 * Enables this flag by adding it to the active flags list.
	 */
	private _enable() {
		DebugFlags.instance.ActiveDebugFlags.push(this.key);
	}

	/**
	 * Disables this flag by removing it from the active flags list.
	 */
	private _disable() {
		const index = DebugFlags.instance.ActiveDebugFlags.indexOf(this.key);
		if (index > -1)
			DebugFlags.instance.ActiveDebugFlags.splice(index, 1);
	}
}

/**
 * Singleton manager for all debug flags in the application.
 *
 * Maintains a registry of all DebugFlag instances and tracks which flags are
 * currently active (enabled). Provides factory methods for creating flags.
 *
 * DebugFlags are used throughout the application to control logging granularity
 * - you can enable/disable logging for specific modules or services by toggling
 * their associated debug flags.
 */
export class DebugFlags {

	/** Singleton instance of DebugFlags */
	static readonly instance: DebugFlags = new DebugFlags();

	/** Registry of all debug flags, keyed by their identifier */
	readonly AllDebugFlags: { [k: string]: DebugFlag } = {};
	/** List of keys for currently enabled (active) debug flags */
	readonly ActiveDebugFlags: string[] = [];

	/**
	 * Private constructor enforces singleton pattern.
	 */
	private constructor() {
	}

	/**
	 * Creates a new DebugFlag and registers it.
	 *
	 * This is the only way to create DebugFlag instances (constructor is private).
	 * The flag is automatically registered in AllDebugFlags.
	 *
	 * @param key - Unique identifier for the flag
	 * @param minLogLevel - Minimum log level (defaults to DebugFlag.DefaultLogLevel)
	 * @returns The newly created DebugFlag
	 */
	public static createFlag(key: string, minLogLevel = DebugFlag.DefaultLogLevel) {
		// @ts-ignore
		return new DebugFlag(key, minLogLevel);
	}

	/**
	 * Registers a debug flag in the AllDebugFlags registry.
	 *
	 * Called automatically when a DebugFlag is created. Should not be called directly.
	 *
	 * @param flag - DebugFlag to register
	 */
	static add(flag: DebugFlag) {
		this.instance.AllDebugFlags[flag.getKey()] = flag;
	}

	/**
	 * Renames a debug flag by updating its key in the registry.
	 *
	 * Moves the flag from the old key to the new key in AllDebugFlags.
	 * Also updates the flag's internal key via the flag's rename method.
	 *
	 * @param previousKey - Current key of the flag
	 * @param newKey - New key for the flag
	 */
	static rename(previousKey: string, newKey: string) {
		const flag = this.instance.AllDebugFlags[previousKey];
		if (!flag)
			return;

		delete this.instance.AllDebugFlags[previousKey];
		this.instance.AllDebugFlags[newKey] = flag;
	}
}
