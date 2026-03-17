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


import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {tsValidateResult} from '../validator/validator-core.js';
import {tsValidateVersion} from '../validator/validators.js';

/**
 * Normalizes a version string by converting non-numeric characters to dots,
 * collapsing multiple consecutive dots, and extracting numeric segments.
 *
 * @param version - Version string to normalize
 * @returns Array of numeric segments
 * @throws BadImplementationException if version contains no numeric segments
 *
 * @example
 * ```typescript
 * normalizeVersion('1.0.0--rc.17') // Returns [1, 0, 0, 17]
 * normalizeVersion('2.3.4-suffix') // Returns [2, 3, 4]
 * normalizeVersion('1.2.3.4.5') // Returns [1, 2, 3, 4, 5]
 * ```
 */
function normalizeVersion(version: string): number[] {
	// Replace all non-numeric characters with dots
	let normalized = version.replace(/[^\d]/g, '.');
	// Replace multiple consecutive dots with single dot
	normalized = normalized.replace(/\.+/g, '.');
	// Trim leading/trailing dots
	normalized = normalized.replace(/^\.+|\.+$/g, '');

	if (!normalized)
		throw new BadImplementationException(`Unable to extract calculable version from '${version}' - no numeric segments found`);

	// Split and convert to numbers
	return normalized.split('.').map(Number);
}

/**
 * Compares two semantic version strings.
 *
 * Normalizes version strings by replacing non-numeric characters with dots,
 * then compares them numerically segment by segment. Supports versions with
 * any number of segments (e.g., "1.0.0", "1.0.0--rc.17", "1.2.3.4.5").
 *
 * **Normalization process**:
 * - Replaces all non-numeric characters (letters, dashes, etc.) with dots
 * - Collapses multiple consecutive dots into a single dot
 * - Extracts numeric segments for comparison
 *
 * **Comparison logic**:
 * - Compares segments from left to right numerically
 * - If all segments are equal up to the minimum length, the version with more segments is considered greater
 * - Returns -1 if first version is greater
 * - Returns 0 if versions are equal
 * - Returns 1 if second version is greater
 *
 * @param firstVersion - First version string (must contain at least one numeric segment)
 * @param secondVersion - Second version string (must contain at least one numeric segment)
 * @returns Comparison result: -1, 0, or 1
 * @throws BadImplementationException if versions are undefined or don't contain numeric segments
 *
 * @example
 * ```typescript
 * compareVersions('1.2.3', '1.2.4') // Returns 1 (second is greater)
 * compareVersions('2.0.0', '1.9.9') // Returns -1 (first is greater)
 * compareVersions('1.0.0', '1.0.0') // Returns 0 (equal)
 * compareVersions('1.0.0--rc.17', '1.0.0--rc.18') // Returns 1 (second is greater)
 * compareVersions('1.0.0', '1.0.0.1') // Returns 1 (second has more segments)
 * ```
 */
export function compareVersions(firstVersion: string, secondVersion: string) {
	if (!firstVersion)
		throw new BadImplementationException('First version is undefined');

	if (!secondVersion)
		throw new BadImplementationException('Second version is undefined');

	const firstVersionAsArray = normalizeVersion(firstVersion);
	const secondVersionAsArray = normalizeVersion(secondVersion);

	const minLength = Math.min(firstVersionAsArray.length, secondVersionAsArray.length);

	// Compare segments up to the minimum length
	for (let i = 0; i < minLength; i++) {
		const firstVal = firstVersionAsArray[i];
		const secondVal = secondVersionAsArray[i];

		if (secondVal > firstVal)
			return 1;

		if (secondVal < firstVal)
			return -1;
	}

	// If all segments are equal up to minimum length, compare by length
	if (firstVersionAsArray.length > secondVersionAsArray.length)
		return -1;

	if (firstVersionAsArray.length < secondVersionAsArray.length)
		return 1;

	return 0;
}

/**
 * Validates that a version string matches the semantic version format (X.Y.Z).
 *
 * Uses the validator system to check that the version string contains exactly
 * three dot-separated numbers with no other content.
 *
 * @param version - Version string to validate
 * @returns Validation result object
 */
export function validateVersion(version: string) {
	return tsValidateResult(version, tsValidateVersion);
}