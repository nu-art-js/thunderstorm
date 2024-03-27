type Constructor<T = {}> = new (...args: any[]) => T;

export type MergeTypes<T extends Constructor<any>[]> =
	T extends [a: Constructor<infer A>, ...rest: infer R] ?
		R extends Constructor<any>[] ?
			A & MergeTypes<R>
			: {}
		: {};

export function MergeClass<T extends Constructor<any>[]>(...plugins: T): Constructor<MergeTypes<T>> {
	class SuperClass {
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

export function CreateMergedInstance<T extends Constructor<any>[]>(...plugins: T): MergeTypes<T> {
	const SuperClass = MergeClass(...plugins);
	return new SuperClass() as MergeTypes<T>;
}
