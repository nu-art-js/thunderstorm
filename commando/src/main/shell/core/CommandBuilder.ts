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
	newlineDelimiter: '\n ',
	indentation: 2,
};

export class CommandBuilder {
	commands: string[] = [];
	private indentation: number = 0;
	private option: Options = defaultOptions;

	/**
	 * Constructs a CommandBuilder instance with given options.
	 * @param {Partial<Options>} [options=defaultOptions] - Configuration options for the CommandBuilder instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		this.option = options as Options;
	}

	/**
	 * Generates a string of spaces for indentation based on the current indentation level.
	 * @returns {string} - A string containing spaces for the current indentation level.
	 */
	protected getIndentation = (): string => {
		return ' '.repeat(this.option.indentation * this.indentation);
	};

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
	 * @param {string} command - The command to append.
	 * @returns {this} - The CommandBuilder instance for method chaining.
	 */
	readonly append = (command: string): this => {
		const commands = command.split(this.option.newlineDelimiter);
		for (const _command of commands) {
			this.commands.push(`${this.getIndentation()}${_command.trim()}`);
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
		return command;
	}
}
