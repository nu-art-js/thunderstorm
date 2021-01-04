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

type FunctionKeys<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];

class Dispatcher<T extends object, K extends FunctionKeys<T>, P = Parameters<T[K]>> {

	protected readonly method: K;

	constructor(method: K) {
		this.method = method;
	}

	public call1(obj: T, ...p: [P]) {
		// here it passes the first argument as an array with disregard to the types
		(obj[this.method])(p);
	}

	public call2(obj: T, p: P) {
		// here compilation error:  type 'P' is not an array
		// but if I ts ignore, it passes as expected
		(obj[this.method])(...[p]);
	}
}


interface TestInterface {
	methodToCall: (str: string, num: number) => void;
}

class TestClass
	implements TestInterface {

	methodToCall(str: string, num: number) {
		console.log({str, num});
	};
}


const instance = new TestClass();

const dispatcher = new Dispatcher<TestInterface, "methodToCall">("methodToCall");

dispatcher.call1(instance, ["string", 42]);
// dispatcher.call1(instance, "string", 42);
// dispatcher.call2(instance, "string", 42);