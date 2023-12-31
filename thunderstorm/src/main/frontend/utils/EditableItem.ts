import {
	_keys,
	ArrayType,
	AssetValueType,
	cloneObj,
	compare,
	DBProto,
	deepClone,
	exists,
	InvalidResult,
	InvalidResultObject,
	isErrorOfType,
	MUSTNeverHappenException,
	removeFromArrayByIndex,
	ResolvableContent,
	resolveContent,
	SubsetKeys,
	ValidationException
} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseApi} from '../modules/db-api-gen/ModuleFE_v3_BaseApi';


export type UIProps_EditableItem<EnclosingItem, K extends keyof EnclosingItem, Type> = {
	editable: EditableItem<EnclosingItem>,
	prop: AssetValueType<EnclosingItem, K, Type | undefined>
}

// type Created<T> = T extends (infer A)[] ? A[] : never;

type ValidationErrors<T> = {
	autoSave: boolean
	editing: boolean
	results: InvalidResult<T>
};

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
	protected validationResults?: ValidationErrors<T>;

	protected originalItem: Partial<T>;
	protected _autoSave: boolean = EditableItem.AUTO_SAVE;

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
	protected saveAction: (item: T) => Promise<T>;
	protected readonly deleteAction: (item: T) => Promise<void>;

	setOnChanged(onChanged?: (editable: EditableItem<T>) => Promise<void>) {
		this.onChanged = onChanged;
		return this;
	}

	setOnSave(onSave: (item: T) => Promise<T>) {
		this.saveAction = onSave;
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
	async updateObj(values: Partial<{ [K in keyof T]: ResolvableContent<T[K] | undefined, [T[K] | undefined]> }>) {
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

	/**
	 * Get a value of a specific property
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @returns Readonly type of the value in T[K].
	 */
	// @ts-ignore
	get<K extends keyof T>(key: K): Readonly<T[K]> | undefined {
		return this.item[key];
	}

	hasError<K extends keyof T>(key: K): Readonly<InvalidResult<T[K]>> | undefined {
		const validationResults = this.validationResults;
		const error = (validationResults?.results as InvalidResultObject<T>)?.[key];
		if (!error)
			return;

		if (validationResults?.editing)
			return error;
	}

	protected setValidationResults(ValidationResults?: ValidationErrors<T>) {
		this.validationResults = ValidationResults;
		return this;
	}

	private autoSave(hasChanges = true) {
		if (!hasChanges)
			return;

		if (this._autoSave)
			return this.save(true);

		const editable = this.clone(this.item as T);
		editable.originalItem = this.originalItem;

		return this.onChanged?.(editable);
	}

	/**
	 * Save the item by calling the saveAction function.
	 *
	 * @returns The promise returned by the saveAction function.
	 */
	async save(consumeError = false) {
		return await this.saveAction(this.item as T);
	}

	/**
	 * Create a new instance of EditableItem with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: T): EditableItem<T> {
		return this.cloneImpl(new EditableItem<T>(item || this.item, this.saveAction, this.deleteAction));
	}

	protected cloneImpl(editable: EditableItem<T>, item?: T) {
		editable.setOnChanged(this.onChanged).setAutoSave(this._autoSave);
		editable.originalItem = item ?? this.originalItem;
		editable.setValidationResults(this.validationResults);
		return editable;
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

		let validationResults: ValidationErrors<T[K]> | undefined;
		const result = (this.validationResults?.results as InvalidResultObject<T>)?.[key];
		if (this.validationResults && exists(result)) {
			validationResults = {
				autoSave: this.validationResults.autoSave,
				editing: this.validationResults.editing,
				results: result! // checked if exists in the above condition
			};
		}

		return new EditableItem<NonNullable<T[K]>>(
			itemToEdit,
			async (value: T[K]) => {
				this.set(key, value);
				return this.autoSave();
			},
			() => this.delete())
			.setValidationResults(validationResults)
			.setAutoSave(true);
	}

	/**
	 * Return a new EditableItem for the DB Entity described by the reference id associated with the provided key and module.
	 *
	 * @template K The type of the key.
	 * @param key The key of the reference id.
	 * @param module The module associated with the reference id.
	 * @param initialValue An initial value to use in case there is no reference id.
	 *
	 * @returns The new EditableItem.
	 */
	editRefV3<Proto extends DBProto<any>, K extends SubsetKeys<keyof T, T, string>>(key: K, module: ModuleFE_v3_BaseApi<Proto>, initialValue: Partial<Proto['uiType']>) {
		const itemId = this.item[key] as string;
		let editingItem;
		if (!exists(itemId))
			editingItem = initialValue;
		else {
			editingItem = module.cache.unique(itemId);
			if (!exists(editingItem))
				throw new MUSTNeverHappenException(`Could not find db item for id: ${itemId} in collection: ${module.dbDef.dbName}`);
		}

		return new EditableDBItemV3<Proto>(editingItem, module);
	}

}

/**
 * A utility class for editing any item of type T that can be stored in a database.
 * This class extends EditableItem and adds functionality related to database operations.
 *
 * @template T The type of the item that extends DB_Object.
 * @template Ks The keys of the T type. Default is '_id'.
 */
export class EditableDBItemV3<Proto extends DBProto<any>>
	extends EditableItem<Proto['uiType']> {

	private readonly module: ModuleFE_v3_BaseApi<Proto>;
	private readonly onError?: (err: Error) => any | Promise<any>;

	/**
	 * Constructs an EditableDBItemV3 instance.
	 *
	 * @param item The item to be edited.
	 * @param module The module for database operations.
	 * @param onCompleted The function to be called when the operation is completed.
	 * @param onError The function to be called when an error occurs.
	 */
	constructor(item: Partial<Proto['uiType']>, module: ModuleFE_v3_BaseApi<Proto>, onCompleted?: (item: Proto['uiType']) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		super(item, EditableDBItemV3.save(module, onCompleted, onError), (_item: Proto['dbType']) => module.v1.delete(_item).executeSync());
		this.module = module;
		this.onError = onError;
		this.save.bind(this);
	}

	private static save<Proto extends DBProto<any>>(module: ModuleFE_v3_BaseApi<Proto>, onCompleted?: (item: Proto['dbType']) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		return async (_item: Proto['uiType']) => {
			try {
				const dbItem = await module.v1.upsert(_item).executeSync();
				await onCompleted?.(dbItem);
			} catch (e: any) {
				await onError?.(e);
				throw e;
			}
		};
	}

	setOnChanged(onChanged?: (editable: EditableItem<Proto['uiType']>) => Promise<void>) {
		this.onChanged = onChanged;
		return this;
	}

	async save(consumeError = false): Promise<Proto['dbType']> {
		try {
			return await super.save(consumeError);
		} catch (e: unknown) {
			const validationException = isErrorOfType(e, ValidationException<Proto['dbType']>);
			if (!validationException)
				throw e;

			this.setValidationResults({
				autoSave: this._autoSave,
				editing: this.validationResults?.editing || !!this.item._id || !this._autoSave,
				results: validationException.result as InvalidResult<Proto['dbType']>
			});

			this._autoSave = true;
			// while getting new errors (for now) we need to call on change in order to replace the editable item instance.. (this will change)
			const editable = this.clone(this.item);
			editable.originalItem = this.originalItem;
			this.onChanged?.(editable);

			if (!consumeError)
				throw e;
		}
	}

	/**
	 * Create a new instance of EditableDBItemV3 with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: Proto['dbType']): EditableDBItemV3<Proto> {
		return this.cloneImpl(new EditableDBItemV3<Proto>(item || this.item, this.module, this.saveAction, this.onError)) as EditableDBItemV3<Proto>;
	}
}
