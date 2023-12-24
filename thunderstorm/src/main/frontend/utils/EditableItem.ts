import {
	_keys,
	ArrayType,
	AssetValueType,
	cloneObj,
	compare,
	deepClone,
	exists,
	InvalidResult, InvalidResultObject,
	isErrorOfType,
	removeFromArrayByIndex,
	ResolvableContent,
	resolveContent,
	ValidationException
} from '@nu-art/ts-common';


export type UIProps_EditableItem<EnclosingItem, K extends keyof EnclosingItem, Type> = {
	editable: EditableItem<EnclosingItem>,
	prop: AssetValueType<EnclosingItem, K, Type | undefined>
}

// type Created<T> = T extends (infer A)[] ? A[] : never;

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
	readonly validationResults?: InvalidResult<T>;

	private originalItem: Partial<T>;
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
		this.originalItem = item;
		this.saveAction = saveAction;
		this.deleteAction = deleteAction;
	}

	protected onChanged?: (editable: EditableItem<T>) => Promise<void>;
	protected readonly saveAction: (item: T) => Promise<T>;
	protected readonly deleteAction: (item: T) => Promise<void>;

	setOnChanged(onChanged?: (editable: EditableItem<T>) => Promise<void>) {
		this.onChanged = onChanged;
		return this;
	}

	hasChanges() {
		// console.group('compare', this.originalItem);
		// console.log('item', this.item);
		// console.log('originalItem', this.originalItem);
		// console.groupEnd();
		return !compare(this.item, this.originalItem);
	}

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
			if (Array.isArray(this.item))
				removeFromArrayByIndex(this.item, key as number);
			else
				delete this.item[key];

			return true;
		}

		if (compare(finalValue, this.item[key]))
			return false;

		this.item[key] = finalValue;
		return true;
	}

	/**
	 * Updates the item with the given values and performs auto-save if enabled.
	 * This method allows partial updates, only the properties provided in the values object will be updated.
	 *
	 * @param values An object with partial properties of T.
	 * @returns A promise representing the auto-save operation if changes were made and auto-save is enabled.
	 */
	async updateObj(values: Partial<{ [K in keyof T]: ResolvableContent<T[K] | undefined> }>) {
		const hasChanges = _keys(values).reduce((hasChanges, prop) => {
			return this.set(prop, values[prop]) || hasChanges;
		}, false);

		return this.autoSave(hasChanges);
	}

	updateArrayAt(value: ArrayType<T>, index: number = (this.item as unknown as any[]).length) {
		return this.updateObj({[index]: value} as Partial<T>);
	}

	removeArrayItem(index: number) {
		return this.updateObj({[index]: undefined} as Partial<T>);
	}

	// async updateArr<P extends Created<T>>(values: Partial<{ [K in keyof P]: ResolvableContent<T[K] | undefined> }>) {
	// 	const hasChanges = _keys(values).reduce((hasChanges, prop) => {
	// 		return this.set(prop, values[prop]) || hasChanges;
	// 	}, false);
	//
	// 	return this.autoSave(hasChanges);
	// }

	/**
	 * Update the value of a specific property in the item and perform auto-save if enabled.
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @param value The new value of the property.
	 * @returns A promise representing the auto-save operation if enabled, undefined otherwise.
	 */
	// @ts-ignore
	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		return this.autoSave(this.set(key, value));
	}

	private setValidationResults(ValidationResults?: InvalidResult<T>) {
		// @ts-ignore
		this.validationResults = ValidationResults;
		return this;
	}

	private autoSave(hasChanges = true) {
		if (!hasChanges)
			return;

		if (this._autoSave)
			return this.save();

		const editable = this.clone(this.item as T);
		editable.originalItem = this.originalItem;

		return this.onChanged?.(editable);
	}

	/**
	 * Save the item by calling the saveAction function.
	 *
	 * @returns The promise returned by the saveAction function.
	 */
	async save() {
		try {
			return await this.saveAction(this.item as T);
		} catch (e: unknown) {
			const validationException = isErrorOfType(e, ValidationException);
			if (!validationException)
				throw e;

			this.setValidationResults(validationException.result as InvalidResult<T>);
		}
	}

	/**
	 * Create a new instance of EditableItem with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: T): EditableItem<T> {
		const editableItem = new EditableItem<T>(item || this.item, this.saveAction, this.deleteAction)
			.setOnChanged(this.onChanged)
			.setAutoSave(this._autoSave);
		editableItem.originalItem = item ?? this.originalItem;
		return editableItem;
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
	editProp<K extends keyof T>(key: K, defaultValue: ResolvableContent<Partial<NonNullable<T[K]>>>) {
		let itemToEdit = this.item[key] || (this.item[key] = resolveContent(defaultValue) as NonNullable<T[K]>);
		if (Array.isArray(itemToEdit) || typeof itemToEdit === 'object')
			itemToEdit = deepClone(itemToEdit);

		return new EditableItem<NonNullable<T[K]>>(
			itemToEdit,
			async (value: T[K]) => {
				this.set(key, value);
				return this.autoSave();
			},
			() => this.delete())
			.setValidationResults((this.validationResults as InvalidResultObject<T>)?.[key])
			.setAutoSave(true);
	}
}