import {EditableItem} from '@nu-art/thunderstorm/frontend';
import {DB_Object, PreDB} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../modules/ModuleFE_BaseApi';


/**
 * A utility class for editing any item of type T that can be stored in a database.
 * This class extends EditableItem and adds functionality related to database operations.
 *
 * @template T The type of the item that extends DB_Object.
 * @template Ks The keys of the T type. Default is '_id'.
 */
export class EditableDBItem<T extends DB_Object, Ks extends keyof T = '_id'>
	extends EditableItem<T> {

	/**
	 * Constructs an EditableDBItem instance.
	 *
	 * @param item The item to be edited.
	 * @param module The module for database operations.
	 * @param onCompleted The function to be called when the operation is completed.
	 * @param onError The function to be called when an error occurs.
	 */
	constructor(item: Partial<T>, module: ModuleFE_BaseApi<T, Ks>, onCompleted?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		super(item, EditableDBItem.save(module, onCompleted, onError), (_item) => module.v1.delete(_item).executeSync());
	}

	private static save<T extends DB_Object, Ks extends keyof T = '_id'>(module: ModuleFE_BaseApi<T, Ks>, onCompleted?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		return async (_item: PreDB<T>) => {
			try {
				const dbItem: T = await module.v1.upsert(_item).executeSync();
				await onCompleted?.(dbItem);
			} catch (e: any) {
				await onError?.(e);
			}
		};
	}

	/**
	 * Create a new instance of EditableDBItem with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: T): EditableDBItem<T> {
		return super.clone(item) as EditableDBItem<T, Ks>;
	}
}