import {BaseCommando} from '../core/BaseCommando';
import {CliBlock} from '../types';


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
 * Represents a Command Line Interface (CLI) to build and execute shell commands.
 */
export class Commando_Basic
	extends BaseCommando {

	/**
	 * Changes directory and optionally executes a block of commands in that directory.
	 * @param {string} folderName - Name of the directory to change to.
	 * @param {CliBlock} [toRun] - Optional block of commands to execute in the directory.
	 * @returns {this} - The Cli instance for method chaining.
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

	public mkdir(dirName: string): this {
		this.append(`mkdir -p ${dirName}`);
		return this;
	}

	public rmdir(dirPath: string, options?: Cli_RmdirOptions): this {
		let command = 'rm';
		if (options?.force)
			command += ' -rf';

		if (options?.recursive)
			command += ' -r';

		this.append(`${command} ${dirPath}`);
		return this;
	}

	public cpdir(srcPath: string, destPath: string, options?: Cli_CpdirOptions): this {
		let command = `cp -r ${srcPath}`;
		if (options?.contentOnly)
			command += '/*';

		command += ` ${destPath}`;
		this.append(command);
		return this;
	}

	public cat(fileName: string) {
		this.append(`cat ${fileName}`);
		return this;
	}

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
	 * Assigns a value to a variable in the script.
	 * @param {string} varName - The name of the variable.
	 * @param {string | string[]} value - The value to assign to the variable.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public assignVar(varName: string, value: string | string[]): this {
		this.append(`${varName}=(${Array.isArray(value) ? value : [value].join(' ')})`);
		return this;
	}
}