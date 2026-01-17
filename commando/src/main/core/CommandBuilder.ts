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

/**
 * Type definition for options used in the CommandBuilder class.
 */
type Options = {
	newlineDelimiter: string; // Delimiter used for separating commands in the execute function.
	indentation: number; // Number of spaces for each indentation level.
};

/**
 * Default options for CommandBuilder class instances.
 */
const defaultOptions: Options = {
	newlineDelimiter: '\n',
	indentation: 2,
};

/**
 * Builds shell commands with indentation and formatting support.
 *
 * Accumulates commands in an array and formats them with proper indentation.
 * Supports custom newline delimiters and indentation levels. Commands can
 * be split across multiple lines using the newline delimiter.
 *
 * **Behavior**:
 * - Commands are trimmed before adding
 * - Empty commands are preserved (for spacing)
 * - Indentation is applied per line when commands contain newlines
 * - `reset()` returns the accumulated command and clears the builder
 */
export class CommandBuilder {
	private initialCommands: string[] = [];

	/** Array of accumulated command strings */
	commands: string[];
	/** Current indentation level (number of indent steps) */
	private indentation: number = 0;
	/** Configuration options for formatting */
	private option: Options = defaultOptions;

	/**
	 * Constructs a CommandBuilder instance with given options.
	 * @param {Partial<Options>} [options=defaultOptions] - Configuration options for the CommandBuilder instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		this.option = options as Options;
		this.commands = [...this.initialCommands];
	}

	/**
	 * Generates a string of spaces for indentation based on the current indentation level.
	 * @returns {string} - A string containing spaces for the current indentation level.
	 */
	protected getIndentation = (): string => {
		return ' '.repeat(this.option.indentation * this.indentation);
	};

	setMark() {
		this.initialCommands = [...this.commands];
	}

	/**
	 * Increases the current indentation level by one.
	 */
	readonly indentIn = () => {
		this.indentation++;
	};

	/**
	 * Decreases the current indentation level by one.
	 */
	readonly indentOut = () => {
		this.indentation--;
	};

	/**
	 * Appends an empty line to the command list for readability.
	 * @returns {this} - The CommandBuilder instance for method chaining.
	 */
	public emptyLine(): this {
		this.append('');
		return this;
	}

	/**
	 * Appends a command to the command list with proper indentation.
	 *
	 * **Behavior**:
	 * - Splits the command by the newline delimiter (allows multi-line commands)
	 * - Trims each line
	 * - Applies current indentation to non-empty lines
	 * - Preserves empty lines as-is (for spacing)
	 *
	 * @param command - Command string to append (can contain newlines)
	 * @returns This instance for method chaining
	 */
	readonly append = (command: string): this => {
		const commands = command.split(this.option.newlineDelimiter);
		for (const _command of commands) {
			const command = _command.trim();
			if (command.length === 0)
				this.commands.push(command);
			else
				this.commands.push(`${this.getIndentation()}${command}`);
		}

		return this;
	};

	/**
	 * Retrieves the full command list as a single string.
	 * @returns {string} - The full command list.
	 */
	getCommand(): string {
		return this.commands.join(this.option.newlineDelimiter);
	}

	/**
	 * Resets the command list and returns the previously accumulated commands.
	 * @returns {string} - The previously accumulated commands.
	 */
	reset(): string {
		const command = this.getCommand();
		this.commands.length = 0;
		this.commands.push(...this.initialCommands);
		return command;
	}
}
