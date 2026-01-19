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

import md from "node-forge";

/**
 * Computes MD5 hash of input data.
 * 
 * **Security Warning**: MD5 is cryptographically broken and should not be used
 * for security purposes (password hashing, digital signatures, etc.). Use SHA-256
 * or SHA-512 instead. MD5 is only suitable for non-security uses like checksums.
 * 
 * @param toBeConverted - Data to hash (string, Buffer, or any value that can be converted)
 * @returns Lowercase hexadecimal hash string
 */
export function md5(toBeConverted: any) {
	return md.md5.create().update(toBeConverted).digest().toHex().toLowerCase();
}

/**
 * Computes SHA-1 hash of input data.
 * 
 * **Security Warning**: SHA-1 is considered cryptographically broken and should
 * not be used for security purposes. Use SHA-256 or SHA-512 instead.
 * 
 * @param toBeConverted - Data to hash
 * @returns Lowercase hexadecimal hash string
 */
export function sha1(toBeConverted: any) {
	return md.sha1.create().update(toBeConverted).digest().toHex().toLowerCase();
}

/**
 * Computes SHA-256 hash of input data.
 * 
 * SHA-256 is cryptographically secure and suitable for security applications.
 * 
 * @param toBeConverted - Data to hash
 * @returns Lowercase hexadecimal hash string
 */
export function sha256(toBeConverted: any) {
	return md.sha256.create().update(toBeConverted).digest().toHex().toLowerCase();
}

/**
 * Computes SHA-384 hash of input data.
 * 
 * SHA-384 is cryptographically secure and suitable for security applications.
 * 
 * @param toBeConverted - Data to hash
 * @returns Lowercase hexadecimal hash string
 */
export function sha384(toBeConverted: any) {
	return md.sha384.create().update(toBeConverted).digest().toHex().toLowerCase();
}

/**
 * Computes SHA-512 hash of input data.
 * 
 * SHA-512 is cryptographically secure and suitable for security applications.
 * 
 * @param toBeConverted - Data to hash
 * @returns Lowercase hexadecimal hash string
 */
export function sha512(toBeConverted: any) {
	return md.sha512.create().update(toBeConverted).digest().toHex().toLowerCase();
}

/**
 * Encodes data to a string using the specified encoding.
 * 
 * Converts various input types (string, number, Buffer) to a Buffer first,
 * then encodes to the target encoding (base64, hex, etc.).
 * 
 * @param data - Data to encode (string, number, or Buffer)
 * @param encoding - Target encoding (default: "base64")
 * @returns Encoded string
 */
export function encode(data: string | number | Buffer, encoding: BufferEncoding = "base64") {
	let buffer: Buffer;
	if (Buffer.isBuffer(data))
		buffer = data;
	else if (typeof data === 'string')
		buffer = Buffer.from(data, 'utf8');
	else
		buffer = Buffer.from(data.toString(), 'utf8');

	return buffer.toString(encoding);
}

/**
 * Decodes an encoded string from one encoding to another.
 * 
 * @param encoded - Encoded string
 * @param from - Source encoding (default: "base64")
 * @param to - Target encoding (default: "utf8")
 * @returns Decoded string
 */
export function decode(encoded: string, from: BufferEncoding = "base64", to: BufferEncoding = "utf8") {
	return Buffer.from(encoded, from).toString(to);
}