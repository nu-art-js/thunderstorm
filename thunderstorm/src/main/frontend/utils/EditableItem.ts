import {AssetValueType, cloneObj, compare, exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';


export type UIProps_EditableItem<EnclosingItem, K extends keyof EnclosingItem, Type> = {
	editable: EditableItem<EnclosingItem>,
	prop: AssetValueType<EnclosingItem, K, Type | undefined>
}

/**
 * A utility class for editing any item of type T.
 * It encapsulates an item along with functions to save and delete the item.
 * This class can be used with any type of item that can be modified, saved, and deleted.
 *
 * @template T The type of the item.
 */
export class EditableItem<T> {
	static AUTO_SAVE = false;

	readonly item: Partial<T>;
	private _autoSave: boolean = EditableItem.AUTO_SAVE;

	/**
	 * Constructs an EditableItem instance.
	 *
	 * @param item The item to be edited.
	 * @param saveAction The function to be called when saving the item.
	 * @param deleteAction The function to be called when deleting the item.
	 */
	constructor(item: Partial<T>, saveAction: (item: T) => Promise<any>, deleteAction: (item: T) => Promise<any>) {
		this.item = Object.isFrozen(item) ? cloneObj(item) : item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
	}

	protected readonly saveAction: (item: T) => Promise<T>;
	protected readonly deleteAction: (item: T) => Promise<void>;

	/**
	 * Set the auto-save mode.
	 *
	 * @param mode The auto-save mode.
	 * @returns The instance itself for method chaining.
	 */
	setAutoSave(mode: boolean) {
		this._autoSave = mode;
		return this;
	}

	/**
	 * Set the value of a specific property in the item.
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @param value The new value of the property.
	 * @returns A boolean indicating whether the value has been set.
	 */
	set<K extends keyof T>(key: K, value: ResolvableContent<T[K] | undefined>) {
		const finalValue = resolveContent(value);
		if (!exists(finalValue) && exists(this.item[key])) {
			delete this.item[key];
			return true;
		}

		if (compare(finalValue, this.item[key]))
			return false;

		this.item[key] = finalValue;
		return true;
	}

	/**
	 * Update the value of a specific property in the item and perform auto-save if enabled.
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @param value The new value of the property.
	 * @returns A promise representing the auto-save operation if enabled, undefined otherwise.
	 */
	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		if (this.set(key, value))
			return this.autoSave();
	}

	private autoSave() {
		if (this._autoSave)
			return this.save();
	}

	/**
	 * Save the item by calling the saveAction function.
	 *
	 * @returns The promise returned by the saveAction function.
	 */
	async save() {
		return this.saveAction(this.item as T);
	}

	/**
	 * Create a new instance of EditableItem with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: T): EditableItem<T> {
		return new EditableItem<T>(item || this.item, this.saveAction, this.deleteAction).setAutoSave(this._autoSave);
	}

	/**
	 * Delete the item by calling the deleteAction function.
	 *
	 * @template K The type of the key.
	 * @returns A promise representing the delete operation.
	 */
	async delete<K extends keyof T>() {
		return this.deleteAction(this.item as T);
	}

	/**
	 * Return a new EditableItem that represents a property of the current item.
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @param defaultValue The default value of the property.
	 * @returns The new EditableItem.
	 */
	editProp<K extends keyof T>(key: K, defaultValue: Partial<NonNullable<T[K]>>) {
		const itemToEdit = this.item[key] || (this.item[key] = defaultValue as NonNullable<T[K]>);
		return new EditableItem<NonNullable<T[K]>>(
			itemToEdit,
			async (value: T[K]) => {
				this.set(key, value);
				return this.autoSave();
			},
			() => this.delete()).setAutoSave(true);
	}
}
