import {CustomException} from '@nu-art/ts-common';
import {ExecException} from 'child_process';


export class CliError
	extends CustomException {

	stdout: string;
	stderr: string;
	cause: ExecException;

	constructor(message: string, stdout: string, stderr: string, cause: ExecException) {
		super(CliError, message, cause);
		this.stdout = stdout;
		this.stderr = stderr;
		this.cause = cause;
	}
}

export class CommandoException
	extends CustomException {

	stdout: string;
	stderr: string;
	exitCode: number;

	constructor(message: string, stdout: string, stderr: string, exitCode: number) {
		super(CliError, message);
		this.stdout = stdout;
		this.stderr = stderr;
		this.exitCode = exitCode;
	}
}