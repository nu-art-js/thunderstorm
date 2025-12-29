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

import {_keys} from '../utils/object-tools.js';

/**
 * CSS style properties for console.log() styling.
 * 
 * Used with the `%c` format specifier in console.log() to apply CSS styles.
 */
export type LogStyle = {
	'color'?: string;
	'background-color'?: string;
	'padding'?: string;
	'border-radius'?: string;
}

/**
 * Generates a CSS style string for console.log() formatting.
 * 
 * Combines multiple style objects into a single CSS string compatible with
 * the `%c` format specifier in console.log().
 * 
 * **Usage**:
 * ```typescript
 * const style = getLogStyle({color: 'red', 'background-color': 'yellow'});
 * console.log('%cStyled text', style, 'normal text');
 * ```
 * 
 * @param styleObj - One or more style objects (merged together)
 * @returns CSS style string
 */
export function getLogStyle(...styleObj: LogStyle[]): string {
	let style = '';
	styleObj.forEach(obj => {
		const _arr = _keys(obj).map(key => `${key}: ${obj[key]}`);
		style += _arr.join(';');
		style += ';';
	});
	return style;
}