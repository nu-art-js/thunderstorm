/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {CliParam} from "../../main";

export type CliTestParam<K extends string, T extends string | string[]> = CliParam<K, T> & {
	value: T extends string ? string[] : string[]
}

export const CliParam_TestString: CliTestParam<"test", string> = {
	keys: ["--test"],
	keyName: "test",
	name: "Test param",
	value: ["test-value"]
}

export const CliParam_TestStringOptional: CliTestParam<"test", string> = {
	...CliParam_TestString,
	optional: true
}

export const CliParam_TestStringDefault: CliTestParam<"test", string> = {
	...CliParam_TestString,
	value: ["test-string-value"],
	defaultValue: "default-test-value",
}

export const CliParam_TestArray: CliTestParam<"test", string[]> = {
	keys: ["--test"],
	keyName: "test",
	name: "Test param",
	isArray: true,
	value: ["test-value1", "test-value2"]
}

export const CliParam_TestArrayOptional: CliTestParam<"test", string[]> = {
	...CliParam_TestArray,
	optional: true
}

export const CliParam_TestArrayDefault: CliTestParam<"test", string[]> = {
	...CliParam_TestArray,
	defaultValue: ["pah", "zevel"]
}