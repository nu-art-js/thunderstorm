export class EditableItem<T> {

	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>) {
		this.item = item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
	}

	readonly item: Partial<T>;
	private readonly saveAction: (item: T) => Promise<void>;
	private readonly deleteAction: (item: T) => Promise<void>;

	update<K extends keyof T>(key: K, value: T[K] | undefined, upsert = true) {
		if (value === undefined)
			delete this.item[key];
		else {
			this.item[key] = value;
		}
		if (!upsert)
			return;

		return this.save();
	}

	save() {
		return this.saveAction(this.item as T);
	}

	delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	editProp<K extends keyof T>(key: K, defaultValue: T[K]) {
		return new EditableItem<T[K]>(this.item[key] || (this.item[key] = defaultValue), async (item: T[K]) => this.update(key, item), () => this.delete());
	}
}
