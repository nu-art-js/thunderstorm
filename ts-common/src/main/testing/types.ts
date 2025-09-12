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

import {ResolvableContent} from '../utils/types.js';

export type Types<Input, Result> = {
	expected?: Result;
	input: Input;
}

export type TestModel<Input, ExpectedResult> = ResolvableContent<
	{
		description?: ResolvableContent<string, [TestModel<Input, ExpectedResult>]>
		input: Input,
	} &
	({ result: ExpectedResult | ((result: ExpectedResult) => Promise<any>)} |
	 {
		 error: { expected: string | RegExp, message?: string, constructor?: Error | Function }
	 })
>


export type TestProcessor<Input, ExpectedResult> = (input: TestModel<Input, ExpectedResult>) => void | Promise<void>;

export type TestSuite<Input, ExpectedResult> = {
	before?: () => (void | Promise<void>);
	processor: TestProcessor<Input, ExpectedResult>;
	after?: () => (void | Promise<void>);
	testcases: TestModel<Input, ExpectedResult>[];
	label: string,
	timeout?: number,
}


export interface TestResetListener {
	__resetForTests: () => Promise<any>;
}

