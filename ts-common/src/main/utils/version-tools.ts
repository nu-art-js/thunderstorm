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
 * Compares two semantic version strings.
 * 
 * Extracts the major.minor.patch pattern from each version string and compares
 * them numerically. Only the first matching pattern is used (e.g., "1.2.3-beta"
 * becomes "1.2.3").
 * 
 * **Comparison logic**:
 * - Compares major, then minor, then patch numbers
 * - Returns -1 if first version is greater
 * - Returns 0 if versions are equal
 * - Returns 1 if second version is greater
 * 
 * @param firstVersion - First version string (must contain X.Y.Z pattern)
 * @param secondVersion - Second version string (must contain X.Y.Z pattern)
 * @returns Comparison result: -1, 0, or 1
 * @throws BadImplementationException if versions are undefined or don't contain X.Y.Z pattern
 * 
 * @example
 * ```typescript
 * compareVersions('1.2.3', '1.2.4') // Returns 1 (second is greater)
 * compareVersions('2.0.0', '1.9.9') // Returns -1 (first is greater)
 * compareVersions('1.0.0', '1.0.0') // Returns 0 (equal)
 * ```
 */
export function compareVersions(firstVersion: string, secondVersion: string) {
	if (!firstVersion)
		throw new BadImplementationException('First version is undefined');

	if (!secondVersion)
		throw new BadImplementationException('Second version is undefined');

	const extractedFirstVersion = firstVersion.match(/\d+\.\d+\.\d+/)?.[0];
	if (!extractedFirstVersion)
		throw new BadImplementationException(`Unable to extract calculable version from '${firstVersion}'`);
	firstVersion = extractedFirstVersion;

	const extractedSecondVersion = secondVersion.match(/\d+\.\d+\.\d+/)?.[0];
	if (!extractedSecondVersion)
		throw new BadImplementationException(`Unable to extract calculable version from '${secondVersion}'`);
	secondVersion = extractedSecondVersion;

	const firstVersionAsArray = firstVersion.split('\.');
	const secondVersionAsArray = secondVersion.split('\.');
	for (let i = 0; i < firstVersionAsArray.length; i++) {
		const secondVal = +secondVersionAsArray[i];
		const firstVal = +firstVersionAsArray[i];
		if (secondVal > firstVal)
			return 1;

		if (secondVal === firstVal)
			continue;

		if (secondVal < firstVal)
			return -1;
	}

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