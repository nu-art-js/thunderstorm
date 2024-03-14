type Constructor<T = {}> = new (...args: any[]) => T;

export type MergeTypes<T extends Constructor<any>[]> =
	T extends [a: Constructor<infer A>, ...rest: infer R] ?
		R extends Constructor<any>[] ?
			A & MergeTypes<R>
			: {}
		: {};

export function MergeClass<T extends Constructor<any>[]>(...plugins: T): Constructor<MergeTypes<T>> {
	class Mixed {
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

	return Mixed as Constructor<MergeTypes<T>>;
}

export function CreateMergedInstance<T extends Constructor<any>[]>(...plugins: T): MergeTypes<T> {
	const MergedClass = MergeClass(...plugins);
	return new MergedClass() as MergeTypes<T>;
}
