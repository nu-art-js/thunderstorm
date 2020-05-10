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
	_values,
	TypedMap
} from "../_main";
import {
	TestModel,
	TestSuit
} from "../../main/testing/test-model";


type FilterKeys = TypedMap<boolean | TypedMap<boolean | TypedMap<boolean>>>

type VersionTest = TestModel<FilterKeys, boolean>;

export const test_filter: TestSuit<VersionTest> = {
	key: 'filters',
	label: "filter",
	processor: async (model: FilterKeys) => {
		return isFilterActive(model);
	},
	models: [
		{input: {one: true, two: false}, expected: true},
		{input: {one: true, two: true}, expected: false},
		{
			input: {
				one: {
					a: true,
					b: {
						a: true,
						b: true
					}
				}, two: true
			}, expected: false
		},
		{
			input: {
				one: {
					a: true, b: true
				}, two: true
			}, expected: false
		}
	]
};

const isFilterActive = (keys: FilterKeys): boolean => {

	return !_values(keys).every((module): boolean => {
		if (typeof module === 'boolean')
			return module

		return _values(module).every((provider): boolean => {
			if (typeof provider === 'boolean')
				return provider

			return _values(provider).every((type): boolean => {
				return type
			})
		})
	})
}