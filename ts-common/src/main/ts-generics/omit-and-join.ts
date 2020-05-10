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


type A = { _id: string }
type B = A & { one: string; two: string }
type C = Omit<B, "_id">;


const valueWithoutId: C = {one: "value-1", two: "value-2"};

// This works just fine...
const valueWithId: B = {...valueWithoutId, _id: "new-id"};

console.log(valueWithId);


function thisBreaks_butWhy<T extends A, U = Omit<T, "_id">>(_valueWithoutId: U) {

	// The following line breaks... Why?
	// @ts-ignore
	const _valueWithId: T = {..._valueWithoutId, _id: "new-id"};
}

function thisBreaksTOO_butWhy<T extends A>(_valueWithoutId: Omit<T, "_id">) {

	// The following line breaks... Why?
	// @ts-ignore
	const _valueWithId: T = {..._valueWithoutId, _id: "new-id"};
}

// @ts-ignore
thisBreaks_butWhy<B>({one: "other-1", two: "other-2", three: "asdasd"})