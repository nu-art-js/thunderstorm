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

import {BaseCommando} from '../core/BaseCommando.js';
import {CliBlock} from '../types.js';


type Cli_EchoOptions = {
	escape?: boolean
	toFile?: {
		name: string,
		append?: boolean
	},
};

type Cli_RmdirOptions = {
	force?: true,
	recursive?: true;
}

type Cli_CpdirOptions = {
	contentOnly?: boolean;
}

/**
 * Basic shell command plugin for Commando.
 *
 * Provides common file system and shell operations:
 * - Directory navigation (`cd`, `pwd`)
 * - File operations (`ls`, `cat`, `mkdir`, `rm`, `rmdir`, `cpdir`)
 * - Variable assignment
 * - Echo with options (escape sequences, file output)
 *
 * **Usage**: Merge with BaseCommando or other Commando classes to add
 * these methods. Typically included via `CommandoPool.allocateCommando()`.
 */
export class Commando_Basic
	extends BaseCommando {

	/**
	 * Changes directory and optionally executes commands in that directory.
	 *
	 * **Behavior**:
	 * - Changes to the specified directory
	 * - Increases indentation (for script readability)
	 * - If `toRun` provided, executes the block and returns to previous directory
	 * - If `toRun` not provided, caller must call `cd_()` to return
	 *
	 * **Note**: Uses `cd -` to return to previous directory (OLDPWD).
	 *
	 * @param folderName - Directory path to change to
	 * @param toRun - Optional command block to execute in the directory
	 * @returns This instance for method chaining
	 */
	cd(folderName: string, toRun?: CliBlock<this>): this {
		this.append(`cd ${folderName}`);
		this.indentIn();

		if (toRun) {
			toRun(this);
			this.cd_();
		}

		return this;
	}

	/**
	 * Appends a custom command string.
	 *
	 * Allows adding arbitrary shell commands that aren't covered by
	 * the built-in methods.
	 *
	 * @param command - Custom shell command to append
	 * @returns This instance for method chaining
	 */
	custom(command: string) {
		this.append(command);
		return this;
	}

	/**
	 * Changes directory back to the previous directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	cd_(): this {
		this.indentOut();
		this.append(`cd -`);
		return this;
	}

	/**
	 * Appends an 'ls' command with optional parameters.
	 * @param {string} [params] - Optional parameters for the 'ls' command.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public ls(params: string = ''): this {
		this.append(`ls ${params}`);
		return this;
	}

	/**
	 * Creates a directory (with parent directories if needed).
	 *
	 * Uses `mkdir -p` to create directory and all parent directories.
	 *
	 * @param dirName - Directory path to create
	 * @returns This instance for method chaining
	 */
	public mkdir(dirName: string): this {
		this.append(`mkdir -p ${dirName}`);
		return this;
	}

	/**
	 * Removes a file or directory.
	 *
	 * @param dirPath - Path to remove
	 * @param options - Optional force flag
	 * @returns This instance for method chaining
	 */
	public rm(dirPath: string, options?: Cli_RmdirOptions): this {
		let command = 'rm';
		if (options?.force)
			command += ' -f';

		this.append(`${command} ${dirPath}`);
		return this;
	}

	/**
	 * Removes a directory recursively.
	 *
	 * @param dirPath - Directory path to remove
	 * @param options - Optional force flag
	 * @returns This instance for method chaining
	 */
	public rmdir(dirPath: string, options?: Cli_RmdirOptions): this {
		let command = 'rm -r';
		if (options?.force)
			command += ' -f';

		this.append(`${command} ${dirPath}`);
		return this;
	}

	/**
	 * Copies a directory.
	 *
	 * @param srcPath - Source directory path
	 * @param destPath - Destination directory path
	 * @param options - Optional contentOnly flag (copies contents, not directory itself)
	 * @returns This instance for method chaining
	 */
	public cpdir(srcPath: string, destPath: string, options?: Cli_CpdirOptions): this {
		let command = `cp -r ${srcPath}`;
		if (options?.contentOnly)
			command += '/*';

		command += ` ${destPath}`;
		this.append(command);
		return this;
	}

	/**
	 * Displays file contents.
	 *
	 * @param fileName - File path to display
	 * @returns This instance for method chaining
	 */
	public cat(fileName: string) {
		this.append(`cat ${fileName}`);
		return this;
	}

	/**
	 * Echoes text with optional escape sequences and file output.
	 *
	 * **Escape Sequences**: When `escape` is true, enables interpretation
	 * of backslash escapes (e.g., `\n`, `\t`).
	 *
	 * **File Output**: Can append or overwrite to a file.
	 *
	 * **Escaping**: Automatically escapes backslashes, newlines, and tabs
	 * in the log string for safe shell execution.
	 *
	 * @param log - Text to echo
	 * @param options - Optional echo configuration
	 * @returns This instance for method chaining
	 */
	public echo(log: string, options?: Cli_EchoOptions): this {
		const _escape = options?.escape ? '-e' : '';
		const _toFile = options?.toFile ? `>${options.toFile.append ? '>' : ''} ${options.toFile.name}` : '';
		const escapedLog = log.replace(/\\/g, '\\\\').replace(/\n/g, '\\\\n').replace(/\t/g, '\\\t');

		this.append(`echo ${_escape} "${escapedLog}" ${_toFile}`);
		return this;
	}

	/**
	 * Appends a 'pwd' command to print the current directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public pwd(): this {
		this.append('pwd');
		return this;
	}

	/**
	 * Assigns a value to a shell variable (array or scalar).
	 *
	 * Creates a bash array if value is an array, otherwise creates a scalar variable.
	 *
	 * @param varName - Variable name
	 * @param value - Value(s) to assign (string or array of strings)
	 * @returns This instance for method chaining
	 */
	public assignVar(varName: string, value: string | string[]): this {
		this.append(`${varName}=(${Array.isArray(value) ? value : [value].join(' ')})`);
		return this;
	}
}