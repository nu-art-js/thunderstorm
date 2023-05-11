import {cloneObj, deepClone, resolveContent} from '@nu-art/ts-common';


export class EditableItem<T> {
	item: Partial<T>;
	private _autoSave: boolean = false;

	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>) {
		this.item = Object.isFrozen(item) ? cloneObj(item) : item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
	}

	protected readonly saveAction: (item: T) => Promise<T>;
	protected readonly deleteAction: (item: T) => Promise<void>;

	setAutoSave(mode: boolean) {
		this._autoSave = mode;
		return this;
	}

	private set<K extends keyof T>(key: K, value: ((item?: T[K]) => (T[K] | undefined)) | T[K] | undefined) {
		const finalValue = resolveContent(value);
		if (finalValue === this.item[key])
			return false;

		if (value === undefined)
			delete this.item[key];
		else
			this.item[key] = finalValue;

		return true;
	}

	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		if (this.set(key, value))
			return this.autoSave();
	}

	private autoSave() {
		if (this._autoSave)
			return this.save();
	}

	async save() {
		return this.saveAction(this.item as T);
	}

	clone(): EditableItem<T> {
		return new EditableItem<T>(this.item, this.saveAction, this.deleteAction).setAutoSave(this._autoSave);
	}

	async delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	editProp<K extends keyof T>(key: K, defaultValue: Partial<NonNullable<T[K]>>) {
		return new EditableItem<NonNullable<T[K]>>(
			deepClone(this.item[key] || (this.item[key] = defaultValue as NonNullable<T[K]>)),
			async (value: T[K]) => {
				this.set(key, value);
				return this.autoSave();
			},
			() => this.delete()).setAutoSave(true);
	}
}
