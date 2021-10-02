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
	return _num.length < length ? padNumber("0" + _num, length) : _num;
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
