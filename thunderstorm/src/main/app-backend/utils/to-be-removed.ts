/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {ApiException} from "../exceptions";

export const assertProperty = <T extends object, K extends keyof T = keyof T>(instance: T, key: K | K[], statusCode: number = 400, check?: string | ((propValue: T[K]) => void)): void => {
	if (Array.isArray(key))
		return key.forEach(k => assertProperty(instance, k, statusCode, check));

	const _key: K = key;
	const value = instance[_key];
	if (!value)
		throw new ApiException(statusCode, `Missing <strong>${key}</strong>`);

	if (!check)
		return;

	if (typeof value === "number")
		return;

	if (typeof value === "string") {
		if (typeof check === "string") {
			if (value.match(check))
				return;

			throw new ApiException(statusCode, `Value <strong>${value}</strong> doesn't match with check: ${check}`)
		}

		return check(value);
	}

	if (typeof value === "object" && typeof check === "function")
		check(value)
};