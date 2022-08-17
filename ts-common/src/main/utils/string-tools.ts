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

export function padNumber(num: number | string, length: number): string {
	const _num = num.toString();
	return _num.length < length ? padNumber('0' + _num, length) : _num;
}

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

export function escape_RegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function stringFormat(input: string, params: string[] = []) {
	return params?.reduce((toRet: string, param, index) => {
		return toRet.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
	}, input || '') || input;
}

2;

export function capitalizeFirstLetter(value: string) {
	return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
}

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

export function levenshteinDistance(str1: string, str2: string): number {
	//Quick exists
	if (str1.length === 0) return str2.length;
	if (str2.length === 0) return str1.length;

	//Get levenshtein distance matrix
	const matrix = createLevenshteinDistanceMatrix(str1, str2);

	//Distance between the strings should be at bottom right corner of the matrix
	return matrix[str1.length][str2.length];
}