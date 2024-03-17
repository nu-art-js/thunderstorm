import {CliBlock, CliWrapper} from './core';


/**
 * Represents a Command Line Interface (CLI) to build and execute shell commands.
 */
export class CliCore
	extends CliWrapper {

	/**
	 * Changes directory and optionally executes a block of commands in that directory.
	 * @param {string} folderName - Name of the directory to change to.
	 * @param {CliBlock} [toRun] - Optional block of commands to execute in the directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	cd(folderName: string, toRun?: CliBlock<this>): this {
		this.cli.append(`cd ${folderName}`);
		this.cli.indentIn();

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
		this.cli.append(`cd -`);
		this.cli.indentOut();
		return this;
	}

	/**
	 * Appends an 'ls' command with optional parameters.
	 * @param {string} [params] - Optional parameters for the 'ls' command.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public ls(params: string = ''): this {
		this.cli.append(`ls ${params}`);
		return this;
	}

	/**
	 * Appends a 'pwd' command to print the current directory.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public pwd(): this {
		this.cli.append('pwd');
		return this;
	}

	/**
	 * Assigns a value to a variable in the script.
	 * @param {string} varName - The name of the variable.
	 * @param {string | string[]} value - The value to assign to the variable.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public assignVar(varName: string, value: string | string[]): this {
		this.cli.append(`${varName}=(${Array.isArray(value) ? value : [value].join(' ')})`);
		return this;
	}
}