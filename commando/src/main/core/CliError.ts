export class CliError
	extends Error {
	stdout: string;
	stderr: string;
	cause?: Error;

	constructor(message: string, stdout: string, stderr: string, cause?: Error) {
		super(message);
		this.stdout = stdout;
		this.stderr = stderr;
		this.cause = cause;
	}
}