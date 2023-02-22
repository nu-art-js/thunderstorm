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


export type Types<Input, Result> = {
	expected?: Result;
	input: Input;
}

export type TestModel<Input, ExpectedResult> = {
	description: string
	result: ExpectedResult,
	input: Input,
}

export type TestProcessor<Input, ExpectedResult> = (input: TestModel<Input, ExpectedResult>) => void | Promise<void>;

export type TestSuite<Input, ExpectedResult> = {
	preProcessor?: () => (void | Promise<void>);
	processor: TestProcessor<Input, ExpectedResult>;
	testcases: TestModel<Input, ExpectedResult>[];
	label: string,
}