import {exec} from 'child_process';


export type CliBlock<Cli extends Commando> = (cli: Cli) => void;

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

/**
 * Represents a Command Line Interface (CLI) to build and execute shell commands.
 */
export class Commando {
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
	 * Changes directory and optionally executes a block of commands in that directory.
	 * @param {string} folderName - Name of the directory to change to.
	 * @param {CliBlock} [toRun] - Optional block of commands to execute in the directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	cd(folderName: string, toRun?: CliBlock<this>): this {
		this.append(`cd ${folderName}`);
		this.indentation++;

		if (toRun) {
			toRun(this);
			this.cd_();
		}

		return this;
	}

	/**
	 * Changes directory back to the previous directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	cd_(): this {
		this.append(`cd -`);
		this.indentation--;
		return this;
	}

	/**
	 * Constructs an if-else conditional command structure.
	 * @param {string} condition - The condition for the if statement.
	 * @param {CliBlock} ifBlock - Block of commands to execute if the condition is true.
	 * @param {CliBlock} [elseBlock] - Optional block of commands to execute if the condition is false.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public if(condition: string, ifBlock: CliBlock<this>, elseBlock?: CliBlock<this>): this {
		this.append(`if ${condition}; then`);
		this.indentation++;
		ifBlock(this);

		if (elseBlock) {
			this.indentation--;
			this.append('else');
			this.indentation++;
			elseBlock(this);
		}

		this.indentation--;
		this.append('fi');
		this.emptyLine();
		return this;
	}

	/**
	 * Constructs a for loop command structure.
	 * @param {string} varName - The variable name used in the loop.
	 * @param {string | string[]} arrayNameOrValues - The array name or array of values to iterate over.
	 * @param {CliBlock} loop - Block of commands to execute in each iteration of the loop.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public for(varName: string, arrayNameOrValues: string | string[], loop: CliBlock<this>): this {
		if (typeof arrayNameOrValues === 'string') {
			this.append(`for ${varName} in "\${${arrayNameOrValues}[@]}"; do`);
		} else {
			const values = arrayNameOrValues.map(value => `"${value}"`).join(' ');
			this.append(`for ${varName} in ${values}; do`);
		}
		this.indentation++;
		loop(this);
		this.indentation--;
		this.append('done');
		this.emptyLine();
		return this;
	}

	/**
	 * Appends an 'ls' command with optional parameters.
	 * @param {string} [params] - Optional parameters for the 'ls' command.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public ls(params: string = ''): this {
		return this.append(`ls ${params}`);
	}

	/**
	 * Appends a 'pwd' command to print the current directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public pwd(): this {
		return this.append('pwd');
	}

	/**
	 * Assigns a value to a variable in the script.
	 * @param {string} varName - The name of the variable.
	 * @param {string | string[]} value - The value to assign to the variable.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public assignVar(varName: string, value: string | string[]): this {
		if (typeof value === 'string')
			return this.append(`${varName}="${value}"`);

		return this.append(`${varName}=(${value.join(' ')})`);
	}

	// INTERNALS
	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	private emptyLine(): this {
		return this.append('');
	}

	/**
	 * Appends a 'continue' command for loop control.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	continue(): this {
		return this.append('continue');
	}

	/**
	 * Appends a 'break' command for loop control.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	break(): this {
		return this.append('break');
	}

	/**
	 * Appends a 'return' command for exiting a function or script.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	return(): this {
		return this.append('return');
	}

	private getIndentation(): string {
		return ' '.repeat(this.option.indentation * this.indentation);
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
}
