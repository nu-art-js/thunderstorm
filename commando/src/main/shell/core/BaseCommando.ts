import {Constructor, ImplementationMissingException} from '@nu-art/ts-common';
import {CommandBuilder} from './CommandBuilder';
import {CreateMergedInstance} from './class-merger';


export class BaseCommando {
	protected readonly builder: CommandBuilder;

	static _create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = CreateMergedInstance(BaseCommando, ...plugins);
		const commando = _commando as typeof _commando & BaseCommando;
		// @ts-ignore
		commando.builder = new CommandBuilder();
		return commando;
	}

	constructor() {
		this.builder = new CommandBuilder();
	}

	append(command: string) {
		this.builder.append(command);
		return this;
	}

	indentIn() {
		this.builder.indentIn();
		return this;
	}

	indentOut() {
		this.builder.indentOut();
		return this;
	}

	/**
	 * Appends an empty line to the script for readability.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public emptyLine(): this {
		this.builder.emptyLine();
		return this;
	}

	async execute(): Promise<void>;
	async execute<T>(callback: (stdout: string, stderr: string, exitCode: number) => T): Promise<T>
	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T | void> {
		throw new ImplementationMissingException('need to override this method in your class');
	}
}
