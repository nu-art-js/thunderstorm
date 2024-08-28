import {Constructor, ImplementationMissingException} from '@thunder-storm/common';
import {CommandBuilder} from './CommandBuilder';
import {CreateMergedInstance} from './class-merger';


export class BaseCommando {
	protected readonly builder: CommandBuilder;
	protected _debug: boolean = false;

	/**
	 * Creates a new instance of BaseCommando merged with the provided plugins.
	 * @param {Constructor<any>[]} plugins - The plugins to merge with BaseCommando.
	 * @returns The Super type merged of BaseCommando and all the plugins provided new instance of BaseCommando merged with the plugins.
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
	 * Toggles or sets the debug mode.
	 * @param {boolean} [debug] - If provided, sets the debug mode to this value. Otherwise, toggles the current debug mode.
	 * @returns {boolean} - The current state of debug mode.
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
