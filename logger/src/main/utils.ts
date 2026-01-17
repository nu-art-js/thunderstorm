/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogParam} from './types.js';


/**
 * Converts an object to a formatted string for logging.
 * 
 * @param instance - Object to stringify
 * @returns Formatted string representation
 */
export function _logger_logObject(instance: object): string {
	return JSON.stringify(instance, null, 2);
}

/**
 * Converts an array of log parameters to an array of strings.
 * 
 * Handles different types appropriately:
 * - undefined → 'undefined'
 * - null → 'null'
 * - string → as-is
 * - number → string conversion
 * - Error → stack trace extraction
 * - object → JSON stringification
 * 
 * @param params - Array of log parameters
 * @returns Array of string representations
 */
export function _logger_convertLogParamsToStrings(params: LogParam[]): string[] {
	return params.map(toLog => {
		if (typeof toLog === 'undefined')
			return 'undefined';

		if (toLog === null)
			return 'null';

		if (typeof toLog === 'string')
			return toLog;

		if (typeof toLog === 'number')
			return `${toLog}`;

		if (typeof toLog === 'function')
			return 'function';

		if (typeof toLog === 'symbol')
			return 'symbol';

		if (typeof toLog === 'bigint')
			return `BigInt(${toLog.toString()})`;

		// @ts-ignore
		if (toLog.stack)
			return _logger_logException(toLog as Error);

		return JSON.stringify(toLog as object, null, 2);
	});
}

/**
 * Formats an Error object into a readable string with stack trace and cause chain.
 * 
 * Processes the error stack trace, removes duplicate stack frames, and handles
 * CustomException instances specially. Recursively processes error causes to build
 * a complete error chain.
 * 
 * **Note**: Mutates and filters the stack trace to remove framework-specific noise
 * and duplicate frames.
 * 
 * @param error - Error object to format
 * @param fullStack - Accumulated stack trace from previous errors in the chain
 * @returns Formatted error string with stack trace
 */
export function _logger_logException(error: Error, fullStack = ''): string {
	let toPrint = '';
	let errorMessage;
	let isCustomException = false;

	if (error.stack) {
		const stackAsList = error.stack.split('\n');
		errorMessage = stackAsList[0];

		const errorMessageIndex = stackAsList.indexOf(errorMessage);
		if (errorMessageIndex > -1)
			stackAsList.splice(errorMessageIndex, 1);
		toPrint = stackAsList.reduce((toRet, stacktrace) => {
			if (fullStack.indexOf(stacktrace) !== -1)
				return toRet;

			return toRet + stacktrace + '\n';
		}, toPrint);

		isCustomException = toPrint.indexOf('CustomException') !== -1;
		toPrint = toPrint.replace(/\s+at.*?CustomException.*?\n/, '\n');
		toPrint = toPrint.replace(/\s+at.*?new\s+(.*?) \(.*?\n/, `${fullStack.length === 0 ? '' : '\nCaused by '}$1: ${errorMessage.replace('Error: ', '')}\n`);

		if (!isCustomException && errorMessage)
			toPrint = errorMessage + '\n' + toPrint;
	}

	const cause: any = (error as any).cause;
	if (cause) {
		let causeStack = _logger_logException(cause, toPrint);
		causeStack = causeStack.replace(`Error: ${cause.message}`, `${cause.message}`);
		toPrint += `${causeStack}`;
	}

	return toPrint;
}

/**
 * Indents all newlines in a string with a prefix.
 * 
 * Useful for formatting multi-line log messages so that continuation lines
 * are properly aligned with the log prefix.
 * 
 * @param linePrefix - Prefix to add before each line
 * @param input - String that may contain newlines
 * @returns String with all newlines prefixed
 */
export function _logger_indentNewLineBy(linePrefix: string, input: string) {
	return linePrefix + input.replace(/\n/g, `\n${linePrefix}`);
}

