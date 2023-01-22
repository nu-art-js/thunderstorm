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

import {
	BadImplementationException,
	deepClone,
	exists
} from '../index';


export function mergeObject(original: any, override: any) {
	if (original === override) {
		return override;
	}

	const returnValue = deepClone(original);
	return Object.keys(override).reduce((obj, key) => {
		obj[key] = merge(original[key], override[key]);

		if (obj[key] === undefined)
			delete obj[key];

		return obj;
	}, returnValue);
}

export function mergeArray(original: any[], override: any[]) {
	if (original === override) {
		return override;
	}

	// const returnValue = deepClone(original);
	// returnValue.reduce((array, value) => {
	// 	array.find((item)=>{
	// 		if()
	// 	});
	// }, returnValue as any[]);
	//
	// var result = original.filter((o1) => {
	// 	return override.some((o2) => {
	//
	// 		let originalKeys = Object.keys(o1);
	// 		originalKeys.some((key) =>)
	// 		return o1.id === o2.id; // return the ones with equal id
	// 	});
	// });

	return override;
}

export function merge(original: any, override: any) {
	if (!exists(override))
		return undefined;

	if (!exists(original))
		return override;

	if (typeof original !== typeof override || (typeof original === 'object' && typeof override === 'object' && Array.isArray(original) !== Array.isArray(override)))
		throw new BadImplementationException(`trying to merge object of different types!! \\n Original: ${JSON.stringify(original)}\\n Override: ${JSON.stringify(override)}`);

	if (Array.isArray(original) && Array.isArray(override))
		return mergeArray(original, override);

	if (typeof original === 'object' && typeof override === 'object' && !Array.isArray(original) && !Array.isArray(override))
		return mergeObject(original || {}, override);

	return override;
}
