import {
	_keys,
	ArrayType,
	AssetValueType,
	awaitedDebounce,
	AwaitedDebounceInstance,
	cloneObj,
	compare,
	DBProto,
	deepClone,
	deleteKeysObject,
	exists,
	generateHex,
	InvalidResult,
	InvalidResultObject,
	isErrorOfType,
	KeysOfDB_Object,
	Logger,
	mergeObject,
	MUSTNeverHappenException,
	RecursiveReadonly,
	removeFromArrayByIndex,
	ResolvableContent,
	resolveContent,
	Second,
	SubsetKeys,
	ValidationException,
	WhoCallThisException
} from '@thunder-storm/common';
import {ModuleFE_BaseApi} from '../modules/db-api-gen/ModuleFE_BaseApi';


export type UIProps_EditableItem<EnclosingItem, K extends keyof EnclosingItem, ItemType, Prop extends AssetValueType<EnclosingItem, K, ItemType> = AssetValueType<EnclosingItem, K, ItemType>> = {
	editable: EditableItem<EnclosingItem>
	prop: Prop,
	ignoreError?: boolean
}

// type Created<T> = T extends (infer A)[] ? A[] : never;

type ValidationErrors<T> = {
	autoSave: boolean
	editing: boolean
	results: InvalidResult<T>
};

export type Editable_SaveAction<T> = (item: T) => Promise<T>;

export type Editable_DeleteAction<T> = (item: T) => Promise<void>;

export type Editable_OnChange<T> = (editable: EditableItem<T>) => Promise<void>;

/**
 * A utility class for editing any item of type T.
 * It encapsulates an item along with functions to save and delete the item.
 * This class can be used with any type of item that can be modified, saved, and deleted.
 *
 * @template T The type of the item.
 */
export class EditableItem<T>
	extends Logger {
	static AUTO_SAVE = false;

	readonly item: Partial<T>;
	protected validationResults?: ValidationErrors<T>;

	protected originalItem: Partial<T>;
	protected _autoSave: boolean = EditableItem.AUTO_SAVE;
	protected _isSaving: boolean = false;

	/**
	 * Constructs an EditableItem instance.
	 *
	 * @param item The item to be edited.
	 * @param saveAction The function to be called when saving the item.
	 * @param deleteAction The function to be called when deleting the item.
	 */
	constructor(item: Partial<T>, saveAction: (item: T) => Promise<T>, deleteAction: (item: T) => Promise<any>) {
		super();
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);

		// @ts-ignore
		if (!!item.__updated) {
			// @ts-ignore
			this.logVerbose(`constructor - ${item.__updated}`, new WhoCallThisException());
		}
		this.item = Object.isFrozen(item) ? cloneObj(item) : item;
		this.originalItem = item;
		this.saveAction = async (item) => {
			// update ui and make sure it called the on change
			this._isSaving = true;
			this.callOnChange();

			try {
				const response = await saveAction(item);

				// call the post save callback if exists
				this.onSaveCompleted?.(response);

				//update is saving flag post save
				this._isSaving = false;

				return response;
			} catch (err: any) {
				this._isSaving = false;
				throw err;
			}
		};
		this.deleteAction = deleteAction;
		this.preformAutoSave.bind(this);
	}

	protected onSaveCompleted?: (item: T) => any;
	protected onChanged?: Editable_OnChange<T>;
	protected saveAction: Editable_SaveAction<T>;
	protected deleteAction: Editable_DeleteAction<T>;

	setOnChanged(onChanged?: Editable_OnChange<T>) {
		this.onChanged = onChanged;
		return this;
	}

	setSaveAction(saveAction: Editable_SaveAction<T>) {
		this.saveAction = saveAction;
		return this;
	}

	setOnDelete(onDelete: (item: T) => Promise<any>) {
		this.deleteAction = onDelete;
		return this;
	}

	setOnSaveCompleted(onSaved?: (item: T) => any) {
		this.onSaveCompleted = onSaved;
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
	 * Get the saving status of the current editable instance
	 * @returns The saving status as boolean
	 */
	isSaving() {
		return this._isSaving;
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
		this.logVerbose(`set: ${String(key)}:`, finalValue as any);
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
		this.logVerbose(`updateObj:`, values);

		const hasChanges = _keys(values).reduce((hasChanges, prop) => {
			return this.set(prop, values[prop]) || hasChanges;
		}, false);

		return this.autoSave(hasChanges);
	}

	/**
	 * Equivalent to array.push
	 * @param value
	 * @param index
	 */
	updateArrayAt(value: ArrayType<T>, index: number = (this.item as unknown as any[]).length) {
		this.logVerbose(`updateArrayAt(${index}):`, value as any);

		return this.updateObj({[index]: value} as Partial<T>);
	}

	removeArrayItem(index: number) {
		this.logVerbose(`removeArrayItem(${index}):`);
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
		this.logVerbose(`updating ${String(key)}`);
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
	get<K extends keyof T>(key: K): RecursiveReadonly<T[K]> {
		return this.item[key] as RecursiveReadonly<T[K]>;
	}

	hasError<K extends keyof T>(key?: K): (Readonly<InvalidResult<T[K]>> | Readonly<string>) | undefined {
		const validationResults = this.validationResults;
		const error = key ? (validationResults?.results as InvalidResultObject<T>)?.[key] : (validationResults?.results as string);
		if (!error)
			return;

		if (validationResults?.editing)
			return error;
	}

	hasErrors = () => !!this.validationResults;

	protected setValidationResults(ValidationResults?: ValidationErrors<T>) {
		this.validationResults = ValidationResults;
		return this;
	}

	/**
	 * If auto save in the editable item is true, preform the save action
	 * Can be overridden in deriving classes
	 * @protected
	 */
	protected async preformAutoSave(): Promise<T | undefined> {
		this.logDebug(`performing autosave`);
		// Return item cloned to make sure it's not frozen
		return deepClone((await this.saveAction(this.item as T)));
	}

	private autoSave(hasChanges = true) {
		if (!hasChanges)
			return this.logVerbose(`will not perform autosave.. no changes`);

		if (this._autoSave)
			try {
				return this.preformAutoSave();
			} catch (err: any) {
				this.logError(`Error while autosave:`, err);
				return this.item;
			}

		if (this.validationResults)
			this.validate();

		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);

		this.logVerbose(`calling onChange - autoSave`);
		return this.onChanged?.(this);
	}

	/**
	 * Save the item by calling the saveAction function.
	 *
	 * @returns The promise returned by the saveAction function.
	 */
	async save(consumeError = true) {
		this.logInfo(`Saving`);

		// Save the current item
		const toRet = await this.saveAction(this.item as T);

		// Make sure to update the instance item and the saving status
		this.callOnChange(deepClone(toRet));
		this.logInfo(`Saved`);
		return toRet;
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

		const editableProp = new EditableItem<NonNullable<T[K]>>(
			itemToEdit,
			async (value: NonNullable<T[K]>) => {
				this.set(key, value);
				await this.autoSave();
				return value;
			},
			() => this.delete())
			.setValidationResults(validationResults)
			.setAutoSave(true);

		this.logVerbose(`editing prop => ${editableProp.tag} - ${String(key)}`);
		return editableProp;
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
	editRefV3<Proto extends DBProto<any>, K extends SubsetKeys<keyof T, T, string>>(key: K, module: ModuleFE_BaseApi<Proto>, initialValue: Partial<Proto['uiType']>) {
		const itemId = this.item[key] as string;
		let editingItem;
		if (!exists(itemId))
			editingItem = initialValue;
		else {
			editingItem = module.cache.unique(itemId);
			if (!exists(editingItem))
				throw new MUSTNeverHappenException(`Could not find db item for id: ${itemId} in collection: ${module.dbDef.dbKey}`);
		}

		return new EditableDBItemV3<Proto>(editingItem, module);
	}

	/**
	 * Implement in children! validate the item using custom logic
	 * @protected
	 */
	validate() {
		return;
	}

	/**
	 * Trigger on change with all necessary actions for the editable instance
	 * @param newItem New item to set as this.item
	 * @param newOriginal New item to set as this.originalItem (optional)
	 * @protected
	 */
	protected callOnChange(newItem?: T, newOriginal?: Partial<T>) {

		// Update item if needed
		if (newItem) {
			// If the new item is a result of a save action it might be frozen, so it must be cloned to be editable
			// @ts-ignore
			this.item = newItem;
			this.originalItem = newOriginal ?? this.item;
		}

		// Make sure UI re-renders
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);
		this.onChanged?.(this);
	}

	/**
	 * handle item update from a different source out of the editable item
	 * @param newItem The item passed to the instance from the third party
	 */
	updateItem(newItem: T) {
		this.callOnChange(newItem);
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

	private readonly module: ModuleFE_BaseApi<Proto>;
	// @ts-ignore
	private readonly onError?: (err: Error) => any | Promise<any>;
	// @ts-ignore
	private debounceInstance?: AwaitedDebounceInstance<[void], Proto['uiType']>;
	private debounceTimeout: number = 2 * Second;

	/**
	 * Constructs an EditableDBItemV3 instance.
	 *
	 * @param item The item to be edited.
	 * @param module The module for database operations.
	 * @param onCompleted The function to be called when the operation is completed.
	 * @param onError The function to be called when an error occurs.
	 * @param debounceInstance Debounce instance from previous editable item
	 */
	constructor(item: Partial<Proto['uiType']>, module: ModuleFE_BaseApi<Proto>, onError?: (err: Error) => any | Promise<any>, debounceInstance?: AwaitedDebounceInstance<any, any>) {
		super(item, EditableDBItemV3.save(module, onError), (_item: Proto['dbType']) => module.v1.delete(_item).executeSync());

		this.module = module;
		this.onError = onError;

		//binds
		this.save.bind(this);
		this.preformAutoSave.bind(this);
	}

	private static save<Proto extends DBProto<any>>(module: ModuleFE_BaseApi<Proto>, onError?: (err: Error) => any | Promise<any>) {
		return async (_item: Proto['uiType']) => {
			try {
				return await module.v1.upsert(_item).executeSync();
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

	setDebounce(debounceInstance?: AwaitedDebounceInstance<[void], Proto['uiType']>) {
		this.debounceInstance = debounceInstance;
		return this;
	}

	async save(consumeError = true): Promise<Proto['dbType']> {
		try {
			return await super.save(consumeError);
		} catch (e: any) {
			this.handleValidationError(e);
			if (!consumeError)
				throw e;
		}
	}

	/**
	 * Preform auto save in editable db item will be in debounce
	 * @protected
	 */
	protected async preformAutoSave(): Promise<Proto['uiType'] | undefined> {
		this.validate();
		return new Promise((resolve, reject) => {
			if (!this.debounceInstance)
				this.debounceInstance = awaitedDebounce({
					func: async () => {
						this.logDebug('Debounce triggered');
						return await super.preformAutoSave();
					},
					timeout: this.debounceTimeout,
					fallbackTimeout: 5 * Second
				});

			this.debounceInstance().then(dbItem => {
				if (!dbItem)
					throw new MUSTNeverHappenException('debounce action must return an item');

				this.logDebug(`Debounce Completed - ${dbItem?.__updated}`);

				// Changing the saving flag back to false and call onChange
				const currentUIItem = deleteKeysObject({...this.item} as Proto['dbType'], [...KeysOfDB_Object, ..._keys(this.module.dbDef.generatedPropsValidator)]);
				this.callOnChange(mergeObject(dbItem, currentUIItem), dbItem);

				// Return the dbItem back as requested in the type
				resolve(dbItem);
			}).catch((err) => {
				this.logError('Debounce Error', err);
				reject(err);
			});

			this.logVerbose(`calling onChange - preformAutoSave`);
			this.callOnChange();
		});
	}

	setDebounceTimeout = (timeout: number): EditableDBItemV3<Proto> => {
		this.debounceTimeout = timeout;
		return this;
	};

	/**
	 * Use the db module provided to validate and update the validation results accordingly
	 * @return preDB item if validation succeeded otherwise returns void
	 */
	validate() {
		try {
			this.module.validateImpl(this.item);
			this.setValidationResults(undefined);
			return this.item as Proto['preDbType'];
		} catch (e: any) {
			this.handleValidationError(e);
		}
	}

	/**
	 * Update db item from a source out of the save action merged with the current UI item in the instance
	 * @param newItem The item passed to the instance from the third party
	 */
	updateItem(newItem: Proto['uiType']) {
		const currentUIItem = deleteKeysObject({...this.item} as Proto['dbType'], [...KeysOfDB_Object, ..._keys(this.module.dbDef.generatedPropsValidator)]);
		super.updateItem(mergeObject(currentUIItem, newItem));

		this.validate();
	}

	private handleValidationError(e: Error) {
		const validationException = isErrorOfType(e, ValidationException<Proto['dbType']>);
		if (!validationException)
			throw e;

		this.logInfo('Validation error while saving');
		this.setValidationResults({
			autoSave: this._autoSave,
			editing: this.validationResults?.editing || !!this.item._id || !this._autoSave,
			results: validationException.result as InvalidResult<Proto['dbType']>
		});

		// while getting new errors (for now) we need to call on change in order to replace the editable item instance.. (this will change)
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);
		this.onChanged?.(this);

	}
}