/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {md} from "node-forge";

export function md5(toBeConverted: any) {
	return md.md5.create().update(toBeConverted).digest().toHex().toLowerCase();
}

export function sha1(toBeConverted: any) {
	return md.sha1.create().update(toBeConverted).digest().toHex().toLowerCase();
}

export function sha256(toBeConverted: any) {
	return md.sha256.create().update(toBeConverted).digest().toHex().toLowerCase();
}

export function sha384(toBeConverted: any) {
	return md.sha384.create().update(toBeConverted).digest().toHex().toLowerCase();
}

export function sha512(toBeConverted: any) {
	return md.sha512.create().update(toBeConverted).digest().toHex().toLowerCase();
}

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

export function decode(encoded: string, from: BufferEncoding = "base64", to: BufferEncoding = "utf8") {
	return Buffer.from(encoded, from).toString(to);
}