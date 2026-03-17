/*
 * commando provides shell command execution framework with interactive sessions and plugin system
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
		super(CommandoException, message);
		this.stdout = stdout;
		this.stderr = stderr;
		this.exitCode = exitCode;
	}
}