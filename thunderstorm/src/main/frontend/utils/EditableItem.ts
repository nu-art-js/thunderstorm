export class EditableItem<T> {
	item: Partial<T>;
	onCompleted?: () => any | Promise<any>;

	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>, onCompleted?: () => any | Promise<any>) {
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

	async update<K extends keyof T>(key: K, value: T[K] | undefined) {
		this.set(key, value);
		return this.save();
	}

	async save() {
		await this.saveAction(this.item as T);
		await this.onCompleted?.();
	}

	clone(): EditableItem<T> {
		return new EditableItem<T>(this.item, this.saveAction, this.deleteAction, this.onCompleted);
	}

	async delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	editProp<K extends keyof T>(key: K, defaultValue: NonNullable<T[K]>) {
		return new EditableItem<NonNullable<T[K]>>(this.item[key] || (this.item[key] = defaultValue), async (item: T[K]) => this.update(key, item), () => this.delete());
	}
}
