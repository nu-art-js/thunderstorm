/*
 * ts-common is the basic building blocks of our typescript projects
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

/**
 * Pads a number or string with leading zeros to reach the specified length.
 *
 * Uses recursion to add zeros until the desired length is reached.
 *
 * @param num - Number or string to pad
 * @param length - Target length
 * @returns Padded string with leading zeros
 */
export function padNumber(num: number | string, length: number): string {
	const _num = num.toString();
	return _num.length < length ? padNumber('0' + _num, length) : _num;
}

/**
 * Converts a string to a hash code (integer).
 *
 * Implements a simple hash function similar to Java's String.hashCode().
 * **Note**: This is not cryptographically secure and should not be used for
 * security purposes. It's suitable for hash tables and non-security use cases.
 *
 * The hash is a 32-bit signed integer, so it can be negative.
 *
 * @param stringToHash - String to hash
 * @returns 32-bit integer hash code
 */
export function stringToHashCode(stringToHash: string) {
	let hash = 0;
	if (stringToHash.length === 0)
		return hash;

	for (let i = 0; i < stringToHash.length; i++) {
		hash = ((hash << 5) - hash) + stringToHash.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}

	return hash;
}

/**
 * Escapes special regex characters in a string.
 *
 * Prepends a backslash to all regex metacharacters so the string can be
 * safely used in a RegExp constructor or pattern.
 *
 * @param string - String to escape
 * @returns Escaped string safe for use in regex
 */
export function escape_RegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Truncates a string to a maximum byte length while preserving UTF-8 encoding.
 *
 * Uses TextEncoder/TextDecoder to handle multi-byte characters correctly.
 * If the string exceeds maxBytes, it's truncated from the specified direction.
 *
 * **Note**: The result may be slightly shorter than maxBytes if truncation
 * occurs in the middle of a multi-byte character sequence.
 *
 * @param string - String to truncate
 * @param maxBytes - Maximum byte length
 * @param direction - Truncate from 'start' (keep beginning) or 'end' (keep end). Default: 'start'
 * @returns Truncated string
 */
export function maxSubstring(string: string, maxBytes: number, direction: 'start' | 'end' = 'start') {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const bytes = encoder.encode(string);

	if (bytes.length <= maxBytes) {
		return string;
	}

	let slicedBytes;
	if (direction === 'start') {
		slicedBytes = bytes.slice(0, maxBytes);
	} else {
		slicedBytes = bytes.slice(-maxBytes);
	}

	return decoder.decode(slicedBytes);
}

/**
 * Calculate the size of a string in the specified unit.
 * @param str - The input string whose size is to be calculated.
 * @param unit - The unit of size ('KB', 'MB', or 'GB').
 * @returns The size of the string in the specified unit.
 * @throws Error if the unit is invalid.
 */
export function getStringSize(str: string, unit: 'KB' | 'MB' | 'GB' = 'KB'): number {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);
	const byteLength = bytes.length;

	switch (unit) {
		case 'KB':
			return byteLength / 1024;
		case 'MB':
			return byteLength / (1024 * 1024);
		case 'GB':
			return byteLength / (1024 * 1024 * 1024);
		default:
			throw new Error('Invalid unit. Please specify "KB", "MB", or "GB".');
	}
}

/**
 * Formats a string by replacing placeholders with parameters.
 *
 * Replaces `{0}`, `{1}`, `{2}`, etc. with corresponding parameters from the array.
 * Uses global regex replacement to handle multiple occurrences of the same placeholder.
 *
 * @param input - String with placeholders like `{0}`, `{1}`, etc.
 * @param params - Array of replacement values
 * @returns Formatted string with placeholders replaced
 *
 * @example
 * ```typescript
 * stringFormat('Hello {0}, you have {1} messages', ['Alice', '5'])
 * // Returns: 'Hello Alice, you have 5 messages'
 * ```
 */
export function stringFormat(input: string, params: string[] = []) {
	return params?.reduce((toRet: string, param, index) => {
		return toRet.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
	}, input || '') || input;
}

/**
 * Replaces a substring at a specific index position.
 *
 * Replaces the substring starting at `index` with `replacement`. The length
 * of the replacement determines how many characters are replaced.
 *
 * @param origin - Original string
 * @param index - Starting index for replacement
 * @param replacement - Replacement string
 * @returns String with replacement applied, or original if inputs are invalid
 */
export function replaceStringAt(origin: string, index: number, replacement: string) {
	if (!origin?.length || !replacement?.length)
		return origin;
	return origin.substring(0, index) + replacement + origin.substring(index + replacement.length);
}

/**
 * Capitalizes the first letter of each word in a string.
 *
 * Words are separated by spaces. The first letter of each word (and the
 * first character of the string) is converted to uppercase.
 *
 * @param value - String to capitalize
 * @returns String with first letter of each word capitalized
 */
export function capitalizeAllFirstLetters(value: string) {
	let resultString = value;
	for (let i = 0; i < resultString.length; i++) {
		if (i === 0 || i > 0 && resultString[i - 1] === ' ')
			resultString = replaceStringAt(resultString, i, resultString[i].toUpperCase());
	}
	return resultString;
}

/**
 * Capitalizes only the first letter of a string and lowercases the rest.
 *
 * @param value - String to capitalize
 * @returns String with first letter uppercase and rest lowercase
 */
export function capitalizeFirstLetter(value: string) {
	return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
}

/**
 * Creates the Levenshtein distance matrix for two strings.
 *
 * The Levenshtein distance (edit distance) is the minimum number of single-character
 * edits (insertions, deletions, or substitutions) required to change one string into another.
 *
 * This function builds the dynamic programming matrix used to calculate the distance.
 * The matrix[i][j] represents the edit distance between the first i characters of str1
 * and the first j characters of str2.
 *
 * **Performance**: O(n*m) time and space complexity where n and m are string lengths.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns 2D matrix with edit distances
 */
export function createLevenshteinDistanceMatrix(str1: string, str2: string): number[][] {
	const len1 = str1.length;
	const len2 = str2.length;

	//Init 2D matrix of size str1.length * str2.length filled with 0
	const matrix = Array.from({length: len1 + 1}).map(() => Array.from({length: len2 + 1}).fill(0)) as number[][];

	//Fill first column and first row with the positions of the chars
	for (let i = 0; i <= len1; i++) matrix[i][0] = i;
	for (let i = 0; i <= len2; i++) matrix[0][i] = i;

	//Fill each cell in matrix with the cost of aligning the two chars based on previous actions in the matrix
	for (let j = 1; j <= len2; j++)
		for (let i = 1; i <= len1; i++)
			matrix[i][j] = Math.min(
				(matrix[i - 1][j]) + 1,
				(matrix[i][j - 1]) + 1,
				(matrix[i - 1][j - 1]) + (str1[i - 1] === str2[j - 1] ? 0 : 1)
			);

	return matrix;
}

/**
 * Calculates the Levenshtein distance (edit distance) between two strings.
 *
 * Returns the minimum number of single-character edits needed to transform
 * str1 into str2. Uses dynamic programming for efficient calculation.
 *
 * **Performance**: O(n*m) time complexity. For very long strings, consider
 * using an optimized algorithm or approximate matching.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance (0 = identical strings, higher = more different)
 */
export function levenshteinDistance(str1: string, str2: string): number {
	//Quick exists
	if (str1.length === 0) return str2.length;
	if (str2.length === 0) return str1.length;

	//Get levenshtein distance matrix
	const matrix = createLevenshteinDistanceMatrix(str1, str2);

	//Distance between the strings should be at bottom right corner of the matrix
	return matrix[str1.length][str2.length];
}

/**
 * Normalizes a string by cleaning up various formatting issues.
 *
 * Performs the following transformations:
 * - Replaces en-dash (–) with hyphen (-)
 * - Removes newlines
 * - Collapses multiple whitespace into single space
 * - Replaces curly apostrophe (') with straight apostrophe (')
 * - Trims leading/trailing whitespace
 *
 * @param string - String to normalize
 * @returns Normalized string
 */
export function normalizeString(string: string): string {
	return string.replace(/–/g, '-').replace(/\n/g, '').replace(/\s+/g, ' ').replace(/'/g, '\'').trim();
}

/**
 * Converts UpperCamelCase or camelCase to a delimited string.
 *
 * Inserts a delimiter between lowercase/number characters and uppercase characters.
 *
 * @param upperCamelCase - CamelCase string to convert
 * @param delimiter - Delimiter to insert (default: space)
 * @returns String with delimiters inserted
 *
 * @example
 * ```typescript
 * convertUpperCamelCase('MyClassName') // 'My Class Name'
 * convertUpperCamelCase('myClassName', '_') // 'my_Class_Name'
 * ```
 */
export function convertUpperCamelCase(upperCamelCase: string, delimiter: string = ' '): string {
	return upperCamelCase.replace(/([a-z0-9])([A-Z])/g, `$1${delimiter}$2`);
}

