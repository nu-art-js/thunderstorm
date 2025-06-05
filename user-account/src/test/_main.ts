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

export * from '../main';
export * from '../main/backend';


// class MyClass {
// 	public f() {
// 		this.func('8');
// 	}
//
// 	private func(param: string): number {
// 		return 0;
// 	}
// }
//
// export function extractPrivateMethod<T extends object, F extends T[K] & ((...args: any[]) => any)>(instance: T, methodName: ): F {
// 	return (instance as any)[methodName] as F;
// }
//
// const myClass = new MyClass();
// const callable = extractPrivateMethod(myClass, 'func');
//
