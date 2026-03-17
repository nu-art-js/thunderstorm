/*
 * commando provides shell command execution framework with interactive sessions and plugin system
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

import {Constructor} from '@nu-art/ts-common';


/**
 * Recursively merges the instance types of multiple constructors.
 *
 * Creates an intersection type of all constructor instance types.
 * Used for the plugin system to combine multiple classes into one.
 *
 * @template T - Array of constructor types
 */
export type MergeTypes<T extends Constructor<any>[]> =
	T extends [a: Constructor<infer A>, ...rest: infer R] ?
		R extends Constructor<any>[] ?
			A & MergeTypes<R>
			: {}
		: {};

/**
 * Merges multiple classes into a single class constructor.
 *
 * Creates a new class that combines all properties and methods from
 * the provided plugin classes. Properties are copied from prototype
 * descriptors during construction.
 *
 * **Use Case**: Plugin system for Commando - allows combining
 * BaseCommando with plugin classes (e.g., Commando_Git, Commando_NVM).
 *
 * **Limitation**: Only copies own properties from prototypes, not
 * inherited properties or static members.
 *
 * @template T - Array of constructor types
 * @param plugins - Constructor classes to merge
 * @returns New constructor that merges all plugin classes
 */
export function MergeClass<T extends Constructor<any>[]>(...plugins: T): Constructor<MergeTypes<T>> {
	class SuperClass {
		/**
		 * Constructs an instance of SuperClass, merging properties from all plugins.
		 * @param {...any[]} args - The arguments to pass to the constructors.
		 */
		constructor(...args: any[]) {
			plugins.forEach(plugin => {
				Object.getOwnPropertyNames(plugin.prototype).forEach(name => {
					const prop = Object.getOwnPropertyDescriptor(plugin.prototype, name);
					if (prop) {
						Object.defineProperty(this, name, prop);
					}
				});
			});
		}
	}

	return SuperClass as Constructor<MergeTypes<T>>;
}

/**
 * Creates an instance of a merged class from multiple constructors.
 *
 * Convenience function that merges classes and immediately instantiates
 * the result. Used by BaseCommando._create() to create plugin instances.
 *
 * @template T - Array of constructor types
 * @param plugins - Constructor classes to merge and instantiate
 * @returns Instance of the merged class
 */
export function CreateMergedInstance<T extends Constructor<any>[]>(...plugins: T): MergeTypes<T> {
	const SuperClass = MergeClass(...plugins);
	return new SuperClass() as MergeTypes<T>;
}
