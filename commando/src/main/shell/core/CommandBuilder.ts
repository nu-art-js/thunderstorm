/**
 * Type definition for options used in Cli class.
 */
type Options = {
	newlineDelimiter: string; // Delimiter used for separating commands in execute function.
	indentation: number; // Number of spaces for each indentation level.
};

/**
 * Default options for Cli class instances.
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
	 * Constructs a CLI instance with given options.
	 * @param {Options} options - Configuration options for the CLI instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		this.option = options as Options;
	}

	protected getIndentation = (): string => {
		return ' '.repeat(this.option.indentation * this.indentation);
	};

	readonly indentIn = () => {
		this.indentation++;
	};

	readonly indentOut = () => {
		this.indentation++;
	};

	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public emptyLine(): this {
		this.append('');
		return this;
	}

	/**
	 * Appends a command or a Cli instance to the command list with proper indentation.
	 * @param {string} command - The command or Cli instance to append.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	readonly append = (command: string): this => {
		const commands = command.split(this.option.newlineDelimiter);
		for (const _command of commands) {
			this.commands.push(`${this.getIndentation()}${_command.trim()}`);
		}

		return this;
	};

	getCommand(): string {
		return this.commands.join(this.option.newlineDelimiter);
	}

	reset(): string {
		const command = this.getCommand();
		this.commands.length = 0;
		return command;
	}
}









