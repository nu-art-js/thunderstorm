import {exec} from 'child_process';


export type CliBlock<Cli extends CliWrapper> = (cli: Cli) => void;

/**
 * Type definition for options used in Cli class.
 */
type Options = {
	newlineDelimiter: string; // Delimiter used for separating commands in execute function.
	shebang: string; // Delimiter used for separating commands in execute function.
	indentation: number; // Number of spaces for each indentation level.
};

/**
 * Default options for Cli class instances.
 */
const defaultOptions: Options = {
	newlineDelimiter: '\n',
	indentation: 2,
	shebang: '#!/bin/bash'
};

export class Cli {
	private indentation = 0;
	private option: Options;
	private commands: string[] = [];

	/**
	 * Constructs a CLI instance with given options.
	 * @param {Options} options - Configuration options for the CLI instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		this.option = options as Options;
		if (this.option.shebang.length > 0) {
			this.append(this.option.shebang);
		}
	}

	/**
	 * Appends a command or a Cli instance to the command list with proper indentation.
	 * @param {string} command - The command or Cli instance to append.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	readonly append = (command: string): this => {
		this.commands.push(`${this.getIndentation()}${command}`);
		return this;
	};

	readonly indentIn = () => {
		this.indentation++;
	};

	readonly indentOut = () => {
		this.indentation++;
	};

	private getIndentation(): string {
		return ' '.repeat(this.option.indentation * this.indentation);
	}

	/**
	 * Executes the accumulated commands in the command list.
	 * @returns {Promise<string>} A promise that resolves with the standard output of the executed command.
	 */
	async execute(): Promise<string> {
		return new Promise((resolve, reject) => {
			const command = this.commands.join(this.option.newlineDelimiter);
			exec(command, (error, stdout, stderr) => {
				if (error)
					reject(error.message);

				if (stderr)
					reject(stderr);

				resolve(stdout);
			});
		});
	}

	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public emptyLine(): this {
		this.append('');
		return this;
	}
}

export class CliWrapper {
	cli: Cli;
}
