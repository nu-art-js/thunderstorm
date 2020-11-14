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
	TestModel,
	TestSuit
} from "../_main";
import {
	CliParam_TestArray,
	CliParam_TestString,
	CliParam_TestStringOptional,
	CliTestParam
} from "./consts";

type CliTestInput = {
	param: CliTestParam<any, any>;
	input?: CliTestParam<any, any>[];
	expected?: CliTestParam<any, any>;
}

type CliModuleTest = TestModel<CliTestInput, "pass" | "fail">;

function generateCliParams(param: CliTestParam<any, any>) {
	return param.value.map((value: string) => `${param.keys[0]}=${value}`);
}

export const testSuit_cliModule: TestSuit<CliModuleTest> = {
	key: "cliModule",
	label: "CliModule",
	processor: async (input) => {
		CliParamsModule.setDefaultConfig({params: [input.expected || input.param]})
		// create the cli input
		const cliInput = flatArray<string>((input.input || [input.param]).map(generateCliParams));

		// resolve the param value
		const retrievedValue: string | string[] = CliParamsModule.getParam(input.param, cliInput)

		// pass optional that doesn't exists
		if (retrievedValue === undefined && input.param.optional)
			return "pass";

		// convert to array.. lower common dominator
		const output = Array.isArray(retrievedValue) ? retrievedValue : [retrievedValue]
		const expected = input.param.value;

		// compare
		return compare(output, expected) ? "pass" : "fail";
	},
	models: [
		{expected: "pass", input: {param: CliParam_TestString}},
		{expected: "fail", input: {param: CliParam_TestString, input: []}},
		{expected: "pass", input: {param: CliParam_TestStringOptional}},
		{expected: "pass", input: {param: CliParam_TestStringOptional, input: []}},
		{expected: "pass", input: {param: CliParam_TestArray}},
	]
};
