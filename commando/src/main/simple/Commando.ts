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

import {Constructor, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {SimpleShell} from './SimpleShell.js';
import {BaseCommando} from '../core/BaseCommando.js';
import {CliError} from '../core/CliError.js';


/**
 * Simple shell command executor extending BaseCommando.
 * 
 * Provides a straightforward way to build and execute shell commands
 * using SimpleShell. Supports file execution and remote file execution.
 * 
 * **Features**:
 * - Command building via BaseCommando fluent API
 * - File execution with optional interpreter
 * - Remote file execution via curl
 * - Error handling with CliError
 * - UID tagging for log identification
 * 
 * **Error Handling**: 
 * - Catches CliError and calls callback with error details
 * - Throws ThisShouldNotHappenException for unexpected errors
 * - Always calls callback (even on error) if provided
 */
export class Commando
	extends BaseCommando {
	/** Optional unique identifier for log tagging */
	private uid?: string;

	/**
	 * Creates a Commando instance with plugins.
	 * 
	 * @template T - Array of plugin constructor types
	 * @param plugins - Plugin classes to merge
	 * @returns Merged Commando instance with plugins
	 */
	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(Commando, ...plugins);
		return _commando as typeof _commando & Commando;
	}

	constructor() {
		super();
	}

	/**
	 * Sets a unique identifier for this commando instance.
	 * 
	 * Used for log tagging to identify which commando instance
	 * generated log messages.
	 * 
	 * @param uid - Unique identifier string
	 * @returns This instance for method chaining
	 */
	setUID(uid: string) {
		this.uid = uid;
		return this;
	}

	/**
	 * Executes a local file with an optional interpreter.
	 * 
	 * If an interpreter is provided, prefixes the file path with it.
	 * Otherwise executes the file directly (must be executable).
	 * 
	 * @param filePath - Path to file to execute
	 * @param interpreter - Optional interpreter (e.g., 'node', 'python3')
	 * @returns Promise resolving to command output
	 */
	executeFile(filePath: string, interpreter?: string) {
		let command = filePath;

		// If an interpreter is provided, prefix the command with it.
		if (interpreter) {
			command = `${interpreter} ${filePath}`;
		}
		return new SimpleShell().execute(command);
	}

	/**
	 * Executes a remote file by downloading and piping to interpreter.
	 * 
	 * Uses curl to download the file and pipes it directly to the interpreter.
	 * Does not save the file locally.
	 * 
	 * **Security Note**: Executes remote code without verification.
	 * 
	 * @param pathToFile - URL to remote file
	 * @param interpreter - Interpreter to execute the file (e.g., 'bash', 'node')
	 * @returns Promise resolving to command output
	 */
	executeRemoteFile(pathToFile: string, interpreter: string) {
		const command = `curl -o- "${pathToFile}" | ${interpreter}`;
		return new SimpleShell().execute(command);
	}

	/**
	 * Executes the accumulated commands and optionally processes output.
	 * 
	 * **Behavior**:
	 * - Resets the command builder (gets accumulated command)
	 * - Creates a new SimpleShell instance with debug mode
	 * - Executes the command
	 * - On success: calls callback with stdout, stderr, exitCode=0
	 * - On error: catches CliError, calls callback with error details, returns result
	 * - On unexpected error: throws ThisShouldNotHappenException
	 * 
	 * **Note**: The callback is always called if provided, even on error.
	 * This allows handling errors without try/catch.
	 * 
	 * @template T - Return type of callback
	 * @param callback - Optional function to process command output
	 * @returns Promise resolving to callback result or void
	 */
	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T | void> {
		const command = this.builder.reset();
		const simpleShell = new SimpleShell().debug(this._debug);
		try {
			if (this.uid)
				simpleShell.setUID(this.uid);

			const {stdout, stderr} = await simpleShell.execute(command);
			return callback?.(stdout, stderr, 0);
		} catch (_error: any) {
			simpleShell.logError(_error);
			const cliError = _error as CliError;
			if ('isInstanceOf' in cliError && cliError.isInstanceOf(CliError))
				return callback?.(cliError.stdout, cliError.stderr, cliError.cause.code ?? -1);

			throw new ThisShouldNotHappenException('Unhandled error', _error);
		}
	}
}
