/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {FirestoreQuery} from "../../../_main";

export type FB_ArrayType = {
	key: string
	value: number
}

export type FB_Type = {
	numeric: number,
	stringValue: string
	booleanValue: boolean
	stringArray: string[]
	objectArray: FB_ArrayType[]
}

export type Query_TestCase<T extends object, E extends T | T[] = T> = FirestoreQuery<T> & {
	insert?: T[]
	label: string,
	expected: E extends T ? Partial<T> : Partial<T>[]
}

export type Patch_TestCase<T extends object> = {
	insert: T,
	override: T,
	query: FirestoreQuery<T>
	label: string,
}