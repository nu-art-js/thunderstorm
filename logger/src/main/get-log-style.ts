/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */


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
		const _arr = (Object.keys(obj) as (keyof LogStyle)[]).map((key) => `${key}: ${obj[key]}`);
		style += _arr.join(';');
		style += ';';
	});
	return style;
}