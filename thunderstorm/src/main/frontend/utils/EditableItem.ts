export class EditableItem<T> {
	item: Partial<T>;
	onCompleted?: (err?: Error) => any | Promise<any>;

	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>, onCompleted?: (err?: Error) => any | Promise<any>) {
		this.item = item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
		this.onCompleted = onCompleted;
	}

	private readonly saveAction: (item: T) => Promise<T>;
	private readonly deleteAction: (item: T) => Promise<void>;

	set<K extends keyof T>(key: K, value: T[K] | undefined) {
		if (value === undefined)
			delete this.item[key];
		else {
			this.item[key] = value;
		}
	}

	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		let finalValue;
		if (typeof value === 'function') { // @ts-ignore
			finalValue = value(this.item[key]);
		} else
			finalValue = value;

		this.set(key, finalValue);
		return this.save();
	}

	async save() {
		try {
			await this.saveAction(this.item as T);
			await this.onCompleted?.();
		} catch (e: any) {
			await this.onCompleted?.(e);
		}
	}

	clone(): EditableItem<T> {
		return new EditableItem<T>(this.item, this.saveAction, this.deleteAction, this.onCompleted);
	}

	async delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	editProp<K extends keyof T>(key: K, defaultValue: Partial<NonNullable<T[K]>>) {
		return new EditableItem<NonNullable<T[K]>>(this.item[key] || (this.item[key] = defaultValue as NonNullable<T[K]>), async (item: T[K]) => this.update(key, item), () => this.delete());
	}
}
