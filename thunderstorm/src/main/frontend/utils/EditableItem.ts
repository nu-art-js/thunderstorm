import {cloneObj, resolveContent} from '@nu-art/ts-common';

export class EditableItem<T> {
	item: Partial<T>;
	autoSave: boolean = false;

	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>) {
		this.item = Object.isFrozen(item) ? cloneObj(item) : item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
	}

	protected readonly saveAction: (item: T) => Promise<T>;
	protected readonly deleteAction: (item: T) => Promise<void>;

	setAutoSave(mode: boolean) {
		this.autoSave = mode;

		return this;
	}

	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		const finalValue = resolveContent(value);
		if (finalValue === this.item[key])
			return;

		if (value === undefined)
			delete this.item[key];
		else
			this.item[key] = finalValue;

		if (this.autoSave)
			return this.save();
	}

	async save() {
		return this.saveAction(this.item as T);
	}

	clone(): EditableItem<T> {
		return new EditableItem<T>(this.item, this.saveAction, this.deleteAction).setAutoSave(this.autoSave);
	}

	async delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	editProp<K extends keyof T>(key: K, defaultValue: Partial<NonNullable<T[K]>>) {
		return new EditableItem<NonNullable<T[K]>>(this.item[key] || (this.item[key] = defaultValue as NonNullable<T[K]>), async (item: T[K]) => this.update(key, item), () => this.delete()).setAutoSave(this.autoSave);
	}
}
