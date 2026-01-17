/*
 * commando provides shell command execution framework with interactive sessions and plugin system
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

import {Constructor, ImplementationMissingException} from '@nu-art/ts-common';
import {CommandBuilder} from './CommandBuilder.js';
import {CreateMergedInstance} from './class-merger.js';


/**
 * Base class for shell command execution with plugin support.
 *
 * Provides a fluent API for building shell commands with indentation support.
 * Uses a plugin system that merges multiple classes into a single instance
 * using the class-merger utility.
 *
 * **Plugin System**: The `_create()` method uses class merging to combine
 * BaseCommando with plugin classes, creating a single instance with methods
 * from all merged classes.
 *
 * **Command Building**: Commands are built using the CommandBuilder, which
 * supports indentation and newline handling. The builder accumulates commands
 * until `execute()` is called.
 *
 * **Note**: The `builder` field is marked readonly but is actually set via
 * `@ts-ignore` in `_create()`. This is a type safety issue.
 */
export class BaseCommando {
	/** Command builder for accumulating shell commands */
	protected readonly builder: CommandBuilder;
	/** Debug mode flag (enables verbose logging) */
	protected _debug: boolean = false;

	/**
	 * Creates a new BaseCommando instance merged with provided plugins.
	 *
	 * Uses class merging to combine BaseCommando with plugin classes into
	 * a single instance. The builder is initialized after merging.
	 *
	 * **Note**: Uses `@ts-ignore` to set the readonly `builder` field.
	 *
	 * @template T - Array of constructor types to merge
	 * @param plugins - Plugin classes to merge with BaseCommando
	 * @returns Merged instance with BaseCommando and all plugin methods
	 */
	static _create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = CreateMergedInstance(BaseCommando, ...plugins);
		const commando = _commando as typeof _commando & BaseCommando;
		// @ts-ignore
		commando.builder = new CommandBuilder();
		return commando;
	}

	/**
	 * Constructs a BaseCommando instance.
	 */
	constructor() {
		this.builder = new CommandBuilder();
	}

	/**
	 * Toggles or sets debug mode.
	 *
	 * When debug is enabled, shell execution provides verbose logging.
	 *
	 * @param debug - Optional value to set (if omitted, toggles current state)
	 * @returns This instance for method chaining
	 */
	debug(debug?: boolean): this {
		this._debug = debug ?? !this._debug;
		return this;
	}

	/**
	 * Appends a command to the command list.
	 * @param {string} command - The command to append.
	 * @returns {this} - The BaseCommando instance for method chaining.
	 */
	append(command: string): this {
		this.builder.append(command);
		return this;
	}

	mark() {
		this.builder.setMark();
		return this;
	}


	/**
	 * Increases the current indentation level by one.
	 * @returns {this} - The BaseCommando instance for method chaining.
	 */
	indentIn(): this {
		this.builder.indentIn();
		return this;
	}

	/**
	 * Decreases the current indentation level by one.
	 * @returns {this} - The BaseCommando instance for method chaining.
	 */
	indentOut(): this {
		this.builder.indentOut();
		return this;
	}

	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The BaseCommando instance for method chaining.
	 */
	public emptyLine(): this {
		this.builder.emptyLine();
		return this;
	}

	/**
	 * Executes the commands. Must be overridden in a subclass.
	 * @throws {ImplementationMissingException} - Always throws this exception.
	 */
	async execute(): Promise<void>;
	/**
	 * Executes the commands with a callback. Must be overridden in a subclass.
	 * @param {Function} callback - A callback function to handle the command output.
	 * @throws {ImplementationMissingException} - Always throws this exception.
	 */
	async execute<T>(callback: (stdout: string, stderr: string, exitCode: number) => T): Promise<T>
	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T | void> {
		throw new ImplementationMissingException('need to override this method in your class');
	}
}
