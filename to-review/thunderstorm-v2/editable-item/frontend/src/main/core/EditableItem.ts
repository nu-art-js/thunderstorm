/** All from @nu-art/ts-common — see _thunderstorm/editable-item-imports-dictionary.md */
import {
	_keys,
	ArrayType,
	AssetValueType,
	AwaitedDebounceInstance,
	compare,
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
	queuedDebounce,
	RecursiveReadonly,
	removeFromArrayByIndex,
	removeItemFromArray,
	ResolvableContent,
	resolveContent,
	Second,
	SubsetKeys,
	ValidationException,
	WhoCallThisException
} from '@nu-art/ts-common';
/** @nu-art/db-api-shared — DB_Prototype: dbKey, dbItem, uiItem, validator, uniqueKeys (use instead of DBProto). */
import type {DB_Prototype} from '@nu-art/db-api-shared';
/** @nu-art/db-api-frontend. Transformation: use ModuleForEditableItem below — db-api has config.dbKey, module.upsert/delete (no v1.executeSync); optional generatedPropKeys replaces dbDef.generatedProps. */
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';

/** Module shape required by EditableDBItemV3 / editRefV3. Optional generatedPropKeys for stripping server-generated keys when merging. */
export type ModuleForEditableItem<Types extends DB_Prototype> = ModuleFE_BaseApi<Types> & {
	generatedPropKeys?: (keyof Types['dbType'])[];
};

export type UIProps_EditableItem<EnclosingItem, K extends keyof EnclosingItem, ItemType, Prop extends AssetValueType<EnclosingItem, K, ItemType> = AssetValueType<EnclosingItem, K, ItemType>> = {
	editable: EditableItem<EnclosingItem>;
	prop: Prop;
	ignoreError?: boolean;
};
// type Created<T> = T extends (infer A)[] ? A[] : never;
type ValidationErrors<T> = {
	autoSave: boolean;
	editing: boolean;
	results: InvalidResult<T>;
};
export type Editable_OnError<T> = (item: Partial<T>, err: Error) => any | Promise<any>;
export type Editable_SaveAction<T> = (item: T) => Promise<T>;
export type Editable_PreSaveAction<T> = (item: T) => void;
export type Editable_DeleteAction<T> = (item: T) => Promise<void>;
export type Editable_OnChange<T> = (editable: EditableItem<T>) => Promise<void>;
export const EditableItemStatus_Saving = 'saving';
export const EditableItemStatus_SavedWithErrors = 'saved-with-errors';
export const EditableItemStatus_FailedValidation = 'failed-validation';
export const EditableItemStatus_ErrorSaving = 'error-saving';
export const EditableItemStatus_UnsavedChanges = 'unsaved-changes';
export const EditableItemStatus_Creating = 'creating';
export const EditableItemStatus_Saved = 'saved';
export const EditableItemStatus_Unknown = 'unknown';
const EditableItemStatuses = [
	EditableItemStatus_Saving,
	EditableItemStatus_SavedWithErrors,
	EditableItemStatus_FailedValidation,
	EditableItemStatus_ErrorSaving,
	EditableItemStatus_UnsavedChanges,
	EditableItemStatus_Creating,
	EditableItemStatus_Saved,
	EditableItemStatus_Unknown,
];
export type EditableItem_Status = typeof EditableItemStatuses[number];

export interface EditableItemStatusListener {
	onEditableItemStatusChanged(newStatus: EditableItem_Status, prevStatus: EditableItem_Status, editableItem: EditableItem<any>): any | Promise<any>;
}

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
	protected readonly internalSaveAction: Editable_SaveAction<T>;
	private status: EditableItem_Status = EditableItemStatus_Unknown;
	private statusListener: EditableItemStatusListener[] = [];
	readonly item!: Partial<T>;
	protected originalItem!: Partial<T>;
	protected validationResults?: ValidationErrors<T>;
	protected conflictingItem?: T;
	protected _autoSave: boolean = EditableItem.AUTO_SAVE;
	protected _isSaving: boolean = false;
	protected saveError?: Error;
	protected onSaveCompleted?: (item: T) => any;
	protected onChanged?: Editable_OnChange<T>;
	protected preSaveAction?: Editable_PreSaveAction<T>;
	private deleteAction!: Editable_DeleteAction<T>;
	private saveAction!: Editable_SaveAction<T>;
	private onError?: Editable_OnError<T>;

	/**
	 * Constructs an EditableItem instance.
	 *
	 * @param item The item to be edited.
	 * @param saveAction The function to be called when saving the item.
	 * @param deleteAction The function to be called when deleting the item.
	 */
	constructor(item: Partial<T>) {
		super();
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);
		// this.setMinLevel(LogLevel.Verbose);
		// @ts-ignore
		if (!!item.__updated) {
			// @ts-ignore
			this.logVerbose(`constructor - ${item.__updated}`, new WhoCallThisException());
		}
		this.internalSaveAction = async (item) => {
			// update ui and make sure it called the on change
			this._isSaving = true;
			this.calculateState();
			this.preSaveAction?.(item);
			this.callOnChange();
			try {
				let response: T = await this.saveAction(item);
				response = this.processResponse(response);
				this.updateItemImpl(response);
				this.callOnChange();
				this.onSaveCompleted?.(response);
				delete this.saveError;
				return response;
			} catch (err: any) {
				this.saveError = err;
				// is this really needed?? from quai fork
				// this.handleValidationError(err as Error);
				if (!this.onError)
					throw err;
				await this.onError(item, err);
				return item;
			} finally {
				this._isSaving = false;
				this.calculateState(); // <== this results in has changes
			}
		};
		this.autoSaveImpl.bind(this);
		this.hasConflicts.bind(this);
		this.processResponse.bind(this);
		this.updateItemImpl(item as T);
		this.calculateState();
	}

	private updateItemImpl(newItem: T) {
		// @ts-ignore
		this['item'] = deepClone(newItem as any);
		this.originalItem = newItem;
	}

	setOnError(onError: Editable_OnError<T>) {
		this.onError = onError;
		return this;
	}

	setOnChanged(onChanged?: Editable_OnChange<T>) {
		this.onChanged = onChanged;
		return this;
	}

	protected handleValidationError(err: Error) {
		throw err;
	}

	setSaveAction(saveAction: Editable_SaveAction<T>) {
		this.saveAction = saveAction;
		return this;
	}

	setDeleteAction(deleteAction: Editable_DeleteAction<T>) {
		this.deleteAction = deleteAction;
		return this;
	}

	setPreSaveAction(preSaveAction: Editable_PreSaveAction<T>) {
		this.preSaveAction = preSaveAction;
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

	setConflictingItem(conflictingItem?: T) {
		if (exists(conflictingItem) && this.hasConflicts(conflictingItem)) {
			this.conflictingItem = conflictingItem;
			this.callOnChange();
			return;
		}
		delete this.conflictingItem;
		if (exists(conflictingItem))
			this.updateItem(conflictingItem);
	}

	protected hasConflicts(conflictingItem: T) {
		return !compare(conflictingItem, this.item);
	}

	hasChanges() {
		// console.group('compare', this.originalItem);
		// console.log('item', this.item);
		// console.log('originalItem', this.originalItem);
		// console.groupEnd();
		return !compare(this.item, this.originalItem);
	}

	addStatusListener(listener: EditableItemStatusListener) {
		this.statusListener.push(listener);
		listener.onEditableItemStatusChanged(this.status, this.status, this);
	}

	removeStatusListener(listener: EditableItemStatusListener) {
		removeItemFromArray(this.statusListener, listener);
	}

	protected calculateState() {
		if (this.isSaving())
			return this.setStatus(EditableItemStatus_Saving);
		if (this.hasValidationError())
			return this.setStatus(EditableItemStatus_FailedValidation);
		if (this.saveError)
			return this.setStatus(EditableItemStatus_ErrorSaving);
		if (this.hasChanges()) {
			return this.setStatus(EditableItemStatus_UnsavedChanges);
		}
		return this.setStatus(EditableItemStatus_Unknown);
	}

	protected setStatus(newStatus: EditableItem_Status) {
		const prevStatus = this.status;
		this.status = newStatus;
		if (prevStatus === newStatus)
			return;
		this.logDebug(`Status changed: ${prevStatus} => ${newStatus}`);
		this.statusListener.forEach(l => l.onEditableItemStatusChanged(newStatus, prevStatus, this));
	}

	getStatus() {
		return this.status;
	}

	/**
	 * Set the auto-save mode.Page_ItemsEditor
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
	async updateObj(values: Partial<{
		[K in keyof T]: ResolvableContent<T[K] | undefined, [
				T[K] | undefined
		]>;
	}>) {
		this.logVerbose(`updateObj:`, values);
		const hasChanges = _keys(values).reduce((hasChanges, prop) => {
			return this.set(prop, values[prop]) || hasChanges;
		}, false);
		this.autoSave(hasChanges);
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
	async update<K extends keyof T>(key: K, value: ((item?: T[K]) => T[K]) | T[K] | undefined) {
		this.logVerbose(`updating ${String(key)}`);
		this.autoSave(this.set(key, value));
	}

	/**
	 * Get a value of a specific property
	 *
	 * @template K The type of the key.
	 * @param key The key of the property.
	 * @param fallbackValue
	 * @returns Readonly type of the value in T[K].
	 */
	// @ts-ignore
	get<K extends keyof T>(key: K, fallbackValue?: T[K]): RecursiveReadonly<T[K]> {
		return (this.item[key] ?? (this.item[key] = fallbackValue)) as RecursiveReadonly<T[K]>;
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
	hasValidationError = () => !!this.validationResults;

	protected setValidationResults(ValidationResults?: ValidationErrors<T>) {
		this.validationResults = ValidationResults;
		return this;
	}

	/**
	 * If auto save in the editable item is true, preform the save action
	 * Can be overridden in deriving classes
	 * @protected
	 */
	protected async autoSaveImpl() {
		this.logDebug(`performing autosave`);
		// Return item cloned to make sure it's not frozen
		await this.internalSaveAction(this.item as T);
	}

	protected processResponse(dbItem: T): T {
		return deepClone(dbItem);
	}

	private autoSave(hasChanges = true) {
		if (!hasChanges)
			return this.logVerbose(`will not perform autosave.. no changes`);
		if (this._autoSave)
			try {
				this.autoSaveImpl();
			} catch (err: any) {
				this.logError(`Error while autosave:`, err);
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
		return this.internalSaveAction(this.item as T);
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
		const editableProp = new EditableItem<NonNullable<T[K]>>(itemToEdit)
			.setSaveAction(async (value: NonNullable<T[K]>) => {
				this.set(key, value);
				await this.autoSave();
				return value;
			})
			.setDeleteAction(() => this.delete())
			.setValidationResults(validationResults)
			.setAutoSave(true);
		if (exists(this.conflictingItem))
			editableProp.setConflictingItem(this.conflictingItem?.[key] as NonNullable<T[K]>);
		this.logVerbose(`editing prop => ${editableProp.tag} - ${String(key)}`);
		return editableProp;
	}

	/**
	 * Return a new EditableItem for the DB Entity described by the reference id associated with the provided key and module.
	 *
	 * @template RefTypes DB_Prototype for the referenced entity.
	 * @template K The type of the key holding the reference id.
	 * @param key The key of the reference id.
	 * @param module The module associated with the reference id.
	 * @param initialValue An initial value to use in case there is no reference id.
	 * @returns The new EditableItem.
	 */
	editRefV3<RefTypes extends DB_Prototype, K extends SubsetKeys<keyof T, T, string>>(
		key: K,
		module: ModuleForEditableItem<RefTypes>,
		initialValue: Partial<RefTypes['uiType']>
	): EditableDBItemV3<RefTypes> {
		const itemId = this.item[key] as string;
		let editingItem: Partial<RefTypes['uiType']>;
		if (!exists(itemId))
			editingItem = initialValue;
		else {
			const cached = module.cache.unique(itemId);
			if (!exists(cached))
				throw new MUSTNeverHappenException(`Could not find db item for id: ${itemId} in collection: ${module.config.dbKey}`);
			editingItem = cached as RefTypes['uiType'];
		}
		return new EditableDBItemV3<RefTypes>(editingItem, module);
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
	 * @protected
	 */
	protected callOnChange() {
		// Make sure UI re-renders
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);
		this.onChanged?.(this);
	}

	/**
	 * handle item update from a different source out of the editable item
	 * @param newItem The item passed to the instance from the third party
	 */
	updateItem(newItem: T) {
		// Update item if needed
		this.updateItemImpl(newItem);
		this.callOnChange();
	}
}

/**
 * A utility class for editing any item of type T that can be stored in a database.
 * Uses @nu-art/db-api-frontend ModuleFE_BaseApi (DB_Prototype); save/delete go through module.upsert / module.delete.
 *
 * @template Types DB_Prototype that define the entity (dbItem, uiItem, etc.).
 */
export class EditableDBItemV3<Types extends DB_Prototype>
	extends EditableItem<Types['uiType']> {
	private readonly module: ModuleForEditableItem<Types>;
	private debounceInstance: ReturnType<typeof queuedDebounce>;
	private debounceTimeout: number = 2 * Second;

	/**
	 * Constructs an EditableDBItemV3 instance.
	 *
	 * @param item The item to be edited.
	 * @param module The module for database operations (ModuleFE_BaseApi / ModuleForEditableItem).
	 * @param debounceInstance Optional debounce instance from a previous editable item.
	 */
	constructor(
		item: Partial<Types['uiType']>,
		module: ModuleForEditableItem<Types>,
		debounceInstance?: AwaitedDebounceInstance<any, any>
	) {
		super(item);
		this.module = module;
		this.setSaveAction(async (_item: Types['uiType']) => await module.upsert(_item));
		this.setDeleteAction(async (item: Types['uiType']) => {
			const id = (item as { _id?: string })._id;
			if (id == null)
				return;
			await module.delete({_id: id} as Parameters<ModuleFE_BaseApi<Types>['delete']>[0]);
		});
		this.debounceInstance = debounceInstance ?? queuedDebounce(async () => {
			this.logDebug('Debounce triggered');
			await this.internalSaveAction(this.item);
		}, this.debounceTimeout, 5 * Second);
		this.save.bind(this);
		this.autoSaveImpl.bind(this);
		this.processResponse.bind(this);
	}

	async save(consumeError = true): Promise<Types['dbType']> {
		try {
			return await super.save(consumeError) as Promise<Types['dbType']>;
		} catch (e: any) {
			this.handleValidationError(e);
			if (!consumeError)
				throw e;
			return undefined as unknown as Types['dbType'];
		}
	}

	private getGeneratedKeys(): (keyof Types['dbType'])[] {
		return this.module.generatedPropKeys ?? [];
	}

	protected processResponse(dbItem: Types['dbType']): Types['dbType'] {
		const keysToStrip = [...KeysOfDB_Object, ...this.getGeneratedKeys()] as (keyof Types['dbType'])[];
		const currentUIItem = deleteKeysObject({...this.item} as Types['dbType'], keysToStrip);
		return mergeObject(dbItem, currentUIItem) as Types['dbType'];
	}

	/**
	 * Perform auto-save in debounce.
	 * @protected
	 */
	protected async autoSaveImpl() {
		if (this.validate())
			this.debounceInstance();
		this.calculateState();
		this.callOnChange();
	}

	setDebounceTimeout = (timeout: number): EditableDBItemV3<Types> => {
		this.debounceTimeout = timeout;
		return this;
	};

	protected hasConflicts(_conflictingItem: Types['dbType']) {
		const keysToStrip = [...KeysOfDB_Object, ...this.getGeneratedKeys()] as (keyof Types['dbType'])[];
		const item = deleteKeysObject({...this.item} as Types['dbType'], keysToStrip);
		const conflictingItem = deleteKeysObject({..._conflictingItem} as Types['dbType'], keysToStrip);
		return !compare(conflictingItem, item);
	}

	protected calculateState() {
		if (this.isSaving())
			return this.setStatus(EditableItemStatus_Saving);
		if (this.hasValidationError() && !this.hasChanges() && this.get('_id'))
			return this.setStatus(EditableItemStatus_SavedWithErrors);
		if (this.hasValidationError())
			return this.setStatus(EditableItemStatus_FailedValidation);
		if (this.saveError)
			return this.setStatus(EditableItemStatus_ErrorSaving);
		if (this.hasChanges()) {
			return this.setStatus(EditableItemStatus_UnsavedChanges);
		}
		if (!this.get('_id'))
			return this.setStatus(EditableItemStatus_Creating);
		if (this.get('_id'))
			return this.setStatus(EditableItemStatus_Saved);
		return this.setStatus(EditableItemStatus_Unknown);
	}

	/**
	 * Validate using the module's validator and clear validation results on success.
	 * @return ui item if validation succeeded, otherwise void (after handleValidationError).
	 */
	validate(): Types['uiType'] | void {
		try {
			this.module.validateImpl(this.item);
			this.setValidationResults(undefined);
			return this.item as Types['uiType'];
		} catch (e: any) {
			this.handleValidationError(e);
		}
	}

	/**
	 * Update item from an external source (e.g. sync), merging with current UI state and re-validating.
	 * @param newItem The item from the third party.
	 */
	override updateItem(newItem: Types['uiType']) {
		this.logWarning(`updating item externally, __updated: ${(newItem as { __updated?: number }).__updated}`);
		const keysToStrip = [...KeysOfDB_Object, ...this.getGeneratedKeys()] as (keyof Types['dbType'])[];
		const currentUIItem = deleteKeysObject({...this.item} as Types['dbType'], keysToStrip);
		super.updateItem(mergeObject(currentUIItem, newItem) as Types['uiType']);
		this.validate();
	}

	protected handleValidationError(e: Error) {
		const validationException = isErrorOfType(e, ValidationException<Types['dbType']>);
		if (!validationException)
			throw e;
		this.logInfo('Validation error while saving');
		this.setValidationResults({
			autoSave: this._autoSave,
			editing: this.validationResults?.editing || !!this.item._id || !this._autoSave,
			results: validationException.result as InvalidResult<Types['dbType']>
		});
		this.setTag(`${this.constructor['name']}-${generateHex(4)}`);
		this.onChanged?.(this);
	}
}
