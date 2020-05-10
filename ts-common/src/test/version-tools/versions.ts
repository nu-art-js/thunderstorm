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


import {compareVersions} from "../_main";
import {
	TestModel,
	TestSuit
} from "../../main/testing/test-model";


type VersionTestInput = {
	one: string;
	two: string;
}

type VersionTest = TestModel<VersionTestInput, -1 | 0 | 1>;

export const testSuit_versionComparison: TestSuit<VersionTest> = {
	key: "version-compare",
	label: "Version Comparison",
	processor: async (model: VersionTestInput) => {
		return compareVersions(model.one, model.two);
	},
	models: [
		{input: {one: "1", two: "2"}, expected: 1},
		{input: {one: "0.0.1", two: "1.0"}, expected: 1},
		{input: {one: "0.1", two: "1.0"}, expected: 1},
		{input: {one: "0.1.1", two: "1.0"}, expected: 1},
		{input: {one: "1", two: "1.0"}, expected: 0},
		{input: {one: "1.0", two: "1.0"}, expected: 0},
		{input: {one: "1.0.0", two: "1.0"}, expected: 0},
		{input: {one: "1.21.0", two: "1.0"}, expected: -1},
		{input: {one: "2", two: "1.0"}, expected: -1},
		{input: {one: "1.33.0.10", two: "1.33.0.7"}, expected: -1},
	]
};

testSuit_versionComparison.models.push(
	...testSuit_versionComparison.models.map(model => {
		const invertedVersion: VersionTest = {
			input: {
				one: model.input.two,
				two: model.input.one
			},
			// @ts-ignore
			expected: model.expected * -1
		};

		return invertedVersion;
	}));

