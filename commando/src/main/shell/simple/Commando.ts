import {Constructor, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {SimpleShell} from './SimpleShell';
import {BaseCommando} from '../core/BaseCommando';
import {CliError} from '../core/CliError';


export class Commando
	extends BaseCommando {
	private uid?: string;

	static create<T extends Constructor<any>[]>(...plugins: T) {
		const _commando = BaseCommando._create(Commando, ...plugins);
		return _commando as typeof _commando & Commando;
	}

	constructor() {
		super();
	}

	setUID(uid: string) {
		this.uid = uid;
		return this;
	}

	executeFile(filePath: string, interpreter?: string) {
		let command = filePath;

		// If an interpreter is provided, prefix the command with it.
		if (interpreter) {
			command = `${interpreter} ${filePath}`;
		}
		return new SimpleShell().execute(command);
	}

	executeRemoteFile(pathToFile: string, interpreter: string) {
		const command = `curl -o- "${pathToFile}" | ${interpreter}`;
		return new SimpleShell().execute(command);
	}

	async execute<T>(callback?: (stdout: string, stderr: string, exitCode: number) => T): Promise<T | void> {
		const command = this.builder.reset();
		try {
			const simpleShell = new SimpleShell().debug(this._debug);
			if (this.uid)
				simpleShell.setUID(this.uid);

			const {stdout, stderr} = await simpleShell.execute(command);
			return callback?.(stdout, stderr, 0);
		} catch (_error: any) {
			console.log(_error);
			const cliError = _error as CliError;
			if ('isInstanceOf' in cliError && cliError.isInstanceOf(CliError))
				return callback?.(cliError.stdout, cliError.stderr, cliError.cause.code ?? -1);

			throw new ThisShouldNotHappenException('Unhandled error', _error);
		}
	}
}
