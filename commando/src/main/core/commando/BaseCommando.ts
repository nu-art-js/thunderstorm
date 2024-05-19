import {Constructor, generateHex, Logger, LogLevel, removeItemFromArray} from '@nu-art/ts-common';
import {CreateMergedInstance} from '../class-merger';
import {Cli} from './Commando';
import {CliInteractive} from './CommandoInteractive';


export class BaseCommando<Cli extends BaseCLI>
	extends Logger {

	static _create<T extends Constructor<any>[]>(...plugins: T) {
		return CreateMergedInstance(...plugins);
	}

	cli!: Cli;

	debug(debug?: boolean) {
		this.cli.debug(debug);
		return this;
	}

	append(command: string) {
		this.cli.append(command);
		return this;
	}

	setUID(uid: string) {
		this.cli.setUID(uid);
		return this;
	}

	addStdoutProcessor(processor: (stdout: string) => void) {
		this.cli.addStdoutProcessor(processor);
		return this;
	}

	addStderrProcessor(processor: (stdout: string) => void) {
		this.cli.addStderrProcessor(processor);
		return this;
	}

	removeStdoutProcessor(processor: (stdout: string) => void) {
		this.cli.removeStdoutProcessor(processor);
		return this;
	}

	removeStderrProcessor(processor: (stdout: string) => void) {
		this.cli.removeStderrProcessor(processor);
		return this;
	}
}

export type CliBlock<Commando extends BaseCommando<Cli | CliInteractive>> = (cli: Commando) => void;

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
	newlineDelimiter: '\n',
	indentation: 2,
};

export class BaseCLI
	extends Logger {

	protected stdoutProcessors: ((stdout: string) => void)[] = [];
	protected stderrProcessors: ((stdout: string) => void)[] = [];

	protected commands: string[] = [];
	private indentation: number = 0;
	protected _debug: boolean = false;
	protected option: Options;
	protected uid: string = generateHex((8));

	/**
	 * Constructs a CLI instance with given options.
	 * @param {Options} options - Configuration options for the CLI instance.
	 */
	constructor(options: Partial<Options> = defaultOptions) {
		super();
		this.setMinLevel(LogLevel.Verbose);
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

	debug(debug?: boolean) {
		this._debug = debug ?? !this._debug;
		return this._debug;
	}

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
		this.commands.push(`${this.getIndentation()}${command}`);
		return this;
	};

	setUID(uuid: string) {
		this.setTag(uuid);
	}

	addStdoutProcessor(processor: (stdout: string) => void) {
		this.stdoutProcessors.push(processor);
	}

	addStderrProcessor(processor: (stderr: string) => void) {
		this.stderrProcessors.push(processor);
	}

	removeStdoutProcessor(processor: (stdout: string) => void) {
		removeItemFromArray(this.stdoutProcessors, processor);
	}

	removeStderrProcessor(processor: (stderr: string) => void) {
		removeItemFromArray(this.stderrProcessors, processor);
	}

}
