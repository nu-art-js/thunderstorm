// import {DB_Object, Default_UniqueKey, PreDB} from '@thunder-storm/common';
// import {EditableItem} from './EditableItem';
//
//
// /**
//  * A utility class for editing any item of type T that can be stored in a database.
//  * This class extends EditableItem and adds functionality related to database operations.
//  *
//  * @template T The type of the item that extends DB_Object.
//  * @template Ks The keys of the T type. Default is '_id'.
//  */
// export class EditableDBItem<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey>
// 	extends EditableItem<T> {
//
// 	/**
// 	 * Constructs an EditableDBItem instance.
// 	 *
// 	 * @param item The item to be edited.
// 	 * @param module The module for database operations.
// 	 * @param onSaved The function to be called when the operation is completed.
// 	 * @param onError The function to be called when an error occurs.
// 	 */
// 	constructor(item: Partial<T>, module: ModuleFE_BaseApi<T, Ks>, onSaved?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
// 		super(item, EditableDBItem.save(module, onSaved, onError), (_item) => module.v1.delete(_item).executeSync());
// 	}
//
// 	private static save<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey>(module: ModuleFE_BaseApi<T, Ks>, onSaved?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
// 		return async (_item: PreDB<T>) => {
// 			try {
// 				const dbItem: T = await module.v1.upsert(_item).executeSync();
// 				await onSaved?.(dbItem);
// 				return dbItem;
// 			} catch (e: any) {
// 				await onError?.(e);
// 				throw e;
// 			}
// 		};
// 	}
// }