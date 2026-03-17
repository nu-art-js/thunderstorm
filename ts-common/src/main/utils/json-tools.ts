import {__stringify} from './tools.js';

/**
 * Checks if a string is valid JSON.
 *
 * Attempts to parse the string and returns true if successful, false if parsing fails.
 *
 * @param _string - String to validate
 * @returns true if string is valid JSON, false otherwise
 */
export function isValidJson(_string: string) {
	try {
		JSON.parse(_string);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Formats an object or JSON string as a prettified JSON string.
 *
 * Uses `__stringify()` with pretty-printing enabled to format the output
 * with indentation and line breaks.
 *
 * @param obj - Object or JSON string to prettify
 * @returns Prettified JSON string
 */
export function prettifyJson<T extends object | string>(obj?: T) {
	return __stringify<T>(obj, true);
}