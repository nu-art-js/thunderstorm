import {Constructor} from '@thunder-storm/common';


/**
 * Type utility to recursively merge the types of constructors in an array.
 * @template T - An array of constructors.
 */
export type MergeTypes<T extends Constructor<any>[]> =
	T extends [a: Constructor<infer A>, ...rest: infer R] ?
		R extends Constructor<any>[] ?
			A & MergeTypes<R>
			: {}
		: {};

/**
 * Function to merge multiple classes into a single class.
 * @template T - An array of constructors.
 * @param {...T} plugins - The constructors to merge.
 * @returns {Constructor<MergeTypes<T>>} - A new constructor that merges all the provided constructors.
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
 * Function to create an instance of a class that merges multiple classes.
 * @template T - An array of constructors.
 * @param {...T} plugins - The constructors to merge.
 * @returns {MergeTypes<T>} - An instance of the merged class.
 */
export function CreateMergedInstance<T extends Constructor<any>[]>(...plugins: T): MergeTypes<T> {
	const SuperClass = MergeClass(...plugins);
	return new SuperClass() as MergeTypes<T>;
}
