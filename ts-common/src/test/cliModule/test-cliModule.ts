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
	CliParam,
	CliParamsModule,
	compare,
	flatArray,
	TestCase,
	TestSuit
} from "../_main";
import {
	CliParam_TestArray,
	CliParam_TestArrayOptional,
	CliParam_TestString,
	CliParam_TestStringDefault,
	CliParam_TestStringOptional,
	CliTestParam
} from "./consts";

type CliTestInput = {
	param: CliTestParam<any, any>;
	input?: CliTestParam<any, any>[];
	expected?: string[];
}

type CliModuleTest = TestCase<CliTestInput, "pass" | "fail">;

function generateCliParams(param: CliTestParam<any, any>) {
	return param.value.map((value: string) => `${param.keys[0]}=${value}`);
}

export const testSuit_cliModule: TestSuit<CliModuleTest> = {
	key: "cliModule",
	label: "CliModule",
	processor: async (input) => {
		CliParamsModule.setDefaultConfig({params: [input.param]})
		// create the cli input
		const cliInput = flatArray<string>((input.input || [input.param]).map(generateCliParams));

		// resolve the param value
		const retrievedValue: string | string[] = CliParamsModule.getParam(input.param, cliInput)

		// pass optional that doesn't exists
		if ((retrievedValue === undefined || retrievedValue.length === 0) && input.param.optional)
			return "pass";

		// convert to array.. lower common dominator
		const output = Array.isArray(retrievedValue) ? retrievedValue : [retrievedValue]
		const expected = input.expected || input.param.value;

		// compare
		return compare(output, expected) ? "pass" : "fail";
	},
	models: [
		{expected: "pass", input: {param: CliParam_TestString}},
		{expected: "fail", input: {param: CliParam_TestString, input: []}},
		{expected: "pass", input: {param: CliParam_TestStringOptional}},
		{expected: "pass", input: {param: CliParam_TestStringOptional, input: []}},
		{expected: "pass", input: {param: CliParam_TestStringDefault, input: [], expected: [CliParam_TestStringDefault.defaultValue as string]}},
		{expected: "pass", input: {param: CliParam_TestStringDefault}},
		{expected: "pass", input: {param: CliParam_TestStringDefault, input: [CliParam_TestString], expected:CliParam_TestString.value}},
		{expected: "fail", input: {param: CliParam_TestStringDefault, input: [CliParam_TestString]}},
		{expected: "pass", input: {param: CliParam_TestArray}},
		{expected: "pass", input: {param: CliParam_TestArrayOptional, input: []}},
		{expected: "fail", input: {param: CliParam_TestArrayOptional, input: [CliParam_TestString]}},
	]
};
