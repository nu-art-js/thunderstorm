import {CustomException} from '@nu-art/ts-common';
import {ExecException} from 'child_process';

/**
 * Exception thrown when a shell command execution fails.
 * 
 * Contains the command output (stdout/stderr) and the underlying
 * ExecException from Node.js child_process.
 */
export class CliError
	extends CustomException {

	/** Standard output from the failed command */
	stdout: string;
	/** Standard error from the failed command */
	stderr: string;
	/** Underlying Node.js ExecException */
	cause: ExecException;

	/**
	 * Creates a CliError instance.
	 * 
	 * @param message - Error message
	 * @param stdout - Standard output from command
	 * @param stderr - Standard error from command
	 * @param cause - Underlying ExecException
	 */
	constructor(message: string, stdout: string, stderr: string, cause: ExecException) {
		super(CliError, message, cause);
		this.stdout = stdout;
		this.stderr = stderr;
		this.cause = cause;
	}
}

/**
 * Exception for commando-specific errors with exit code.
 * 
 * Similar to CliError but includes an explicit exit code rather than
 * extracting it from the ExecException.
 * 
 * **Note**: The constructor incorrectly passes `CliError` as the exception
 * type instead of `CommandoException`. This is a bug.
 */
export class CommandoException
	extends CustomException {

	/** Standard output from the command */
	stdout: string;
	/** Standard error from the command */
	stderr: string;
	/** Exit code from the command */
	exitCode: number;

	/**
	 * Creates a CommandoException instance.
	 * 
	 * @param message - Error message
	 * @param stdout - Standard output
	 * @param stderr - Standard error
	 * @param exitCode - Command exit code
	 */
	constructor(message: string, stdout: string, stderr: string, exitCode: number) {
		super(CliError, message);
		this.stdout = stdout;
		this.stderr = stderr;
		this.exitCode = exitCode;
	}
}