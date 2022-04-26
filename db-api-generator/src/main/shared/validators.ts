/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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

import {tsValidateRegexp} from '@nu-art/ts-common';
export const dbIdLength = 32;

export const tsValidateId = (length: number, mandatory: boolean = true) => tsValidateRegexp(new RegExp(`^[0-9a-f]{${length}}$`), mandatory);
export const tsValidateEmail = tsValidateRegexp(
	/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
export const tsValidateBucketUrl = (mandatory?: boolean) => tsValidateRegexp(
	/gs?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
export const tsValidateGeneralUrl = (mandatory?: boolean) => tsValidateRegexp(
	/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/, mandatory);
export const tsValidateVersion = tsValidateRegexp(/\d{1,3}\.\d{1,3}\.\d{1,3}/);
export const tsValidateUniqueId = tsValidateId(dbIdLength);
export const tsValidateOptionalId = tsValidateId(dbIdLength, false);
export const tsValidateStringWithDashes = tsValidateRegexp(/^[A-Za-z-]+$/);
export const tsValidateStringAndNumbersWithDashes = tsValidateRegexp(/^[0-9A-Za-z-]+$/);
export const tsValidator_JavaObjectMemberName = tsValidateRegexp(/^[a-z][a-zA-Z0-9]+$/);
export const tsValidateNameWithDashesAndDots = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidator_LowercaseStringWithDashes = tsValidateRegexp(/^[a-z-.]+$/);
export const tsValidator_LowerUpperStringWithSpaces = tsValidateRegexp(/^[A-Za-z ]+$/);
export const tsValidator_LowerUpperStringWithDashesAndUnderscore = tsValidateRegexp(/^[A-Za-z-_]+$/);
export const tsValidator_InternationalPhoneNumber = tsValidateRegexp(/^\+(?:[0-9] ?){6,14}[0-9]$/);
