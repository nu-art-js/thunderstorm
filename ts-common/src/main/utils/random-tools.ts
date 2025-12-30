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

import {randomBytes} from 'crypto';

/**
 * Generates a cryptographically secure random hexadecimal string.
 * 
 * Uses `crypto.randomBytes()` for secure random generation. The length may be
 * slightly longer than requested if an odd length is specified (due to hex
 * encoding), so the result is sliced to the exact length.
 * 
 * @param length - Desired length of hex string
 * @returns Lowercase hexadecimal string of the specified length
 */
export function generateHex(length: number) {
	return randomBytes(Math.ceil(length / 2))
		.toString('hex')
		.slice(0, length).toLowerCase();
}

/**
 * Generates a UUID v4 (random UUID).
 * 
 * **Security Warning**: Uses `Math.random()` which is not cryptographically secure.
 * For security-sensitive use cases, use a library that generates cryptographically
 * secure UUIDs (e.g., `crypto.randomUUID()` in Node.js 14.17+).
 * 
 * @returns UUID string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * Generates an 8-character string suitable for short URL usage.
 * 
 * Uses cryptographically secure random bytes to generate a URL-safe identifier.
 * Character set includes alphanumeric characters plus dash and underscore.
 * 
 * @returns 8-character string for short URL
 */
export function generateShortURL(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	let result = '';
	const random = randomBytes(8); // Generate 8 random bytes

	for (let i = 0; i < 8; i++) {
		const byte = random[i];
		result += chars.charAt(byte % chars.length);
	}

	return result;
}