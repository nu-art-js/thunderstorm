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

import {_keys} from "./object-tools";
import {ObjectTS} from "./types";

export function regexpCase(value: string, reg: string) {
	return value.match(new RegExp(reg)) || {input: undefined};
}

export function createFilterPattern(rawFilter?: string) {
	let filter = rawFilter || "";
	filter = filter.trim();
	filter = filter.replace(/\s+/, " ");
	filter = filter.replace(new RegExp("(.)", "g"), ".*?$1");
	filter.length === 0 ? filter = ".*?" : filter += ".*";
	return filter;
}

export function calculateJsonSizeMb(data: ObjectTS) {
	const number = JSON.stringify(data).length / 1024 / 1024;
	return Math.round(number * 100) / 100;
}

export function __stringify<T>(obj: T, pretty?: boolean | (keyof T)[]): string {
	if (Array.isArray(pretty))
		return `${_keys(obj).reduce((carry: string, key: keyof T, idx: number) => {
			return carry + `  ${key}: ${__stringify(obj[key], pretty.includes(key))}${idx !== _keys(obj).length - 1 && ',\n'}`;
		}, `{\n`)}\n}`;

	if (pretty)
		return JSON.stringify(obj, null, 2);

	return JSON.stringify(obj);
}
