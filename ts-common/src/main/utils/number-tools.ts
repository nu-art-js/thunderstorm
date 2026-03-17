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

/**
 * Rounds a number to a specified number of decimal places.
 *
 * Uses the standard rounding algorithm (rounds to nearest, with .5 rounding up).
 *
 * @param number - Number to round
 * @param digits - Number of decimal places
 * @returns Rounded number
 *
 * @example
 * ```typescript
 * roundNumber(3.14159, 2) // 3.14
 * roundNumber(3.14159, 0) // 3
 * ```
 */
export const roundNumber = (number: number, digits: number) => {
	const multiple = Math.pow(10, digits);
	return Math.round(number * multiple) / multiple;
};

/**
 * Clamps a number between a minimum and maximum value.
 *
 * If the number is less than min, returns min. If greater than max, returns max.
 * Otherwise returns the number unchanged.
 *
 * @param min - Minimum value
 * @param num - Number to clamp
 * @param max - Maximum value
 * @returns Clamped number
 *
 * @example
 * ```typescript
 * clamp(0, 5, 10) // 5
 * clamp(0, -5, 10) // 0
 * clamp(0, 15, 10) // 10
 * ```
 */
export const clamp = (min: number, num: number, max: number) => Math.min(Math.max(num, min), max);

/**
 * Checks if a number is within a specified range (inclusive).
 *
 * @param number - Number to check
 * @param range - Tuple [min, max] representing the range
 * @returns true if number is within range, false otherwise
 *
 * @example
 * ```typescript
 * numberInRange(5, [0, 10]) // true
 * numberInRange(0, [0, 10]) // true (inclusive)
 * numberInRange(11, [0, 10]) // false
 * ```
 */
export const numberInRange = (number: number, range: [number, number]) => {
	return range[0] <= number && number <= range[1];
};