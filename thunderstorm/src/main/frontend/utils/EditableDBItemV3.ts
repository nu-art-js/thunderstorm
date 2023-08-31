import {DBProto} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseApi} from '../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {EditableItem} from './EditableItem';


/**
 * A utility class for editing any item of type T that can be stored in a database.
 * This class extends EditableItem and adds functionality related to database operations.
 *
 * @template T The type of the item that extends DB_Object.
 * @template Ks The keys of the T type. Default is '_id'.
 */
export class EditableDBItemV3<Proto extends DBProto<any>>
	extends EditableItem<Proto['uiType']> {

	/**
	 * Constructs an EditableDBItemV3 instance.
	 *
	 * @param item The item to be edited.
	 * @param module The module for database operations.
	 * @param onCompleted The function to be called when the operation is completed.
	 * @param onError The function to be called when an error occurs.
	 */
	constructor(item: Proto['uiType'], module: ModuleFE_v3_BaseApi<Proto>, onCompleted?: (item: Proto['uiType']) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		super(item, EditableDBItemV3.save(module, onCompleted, onError), (_item: Proto['dbType']) => module.v1.delete(_item).executeSync());
	}

	private static save<Proto extends DBProto<any>>(module: ModuleFE_v3_BaseApi<Proto>, onCompleted?: (item: Proto['dbType']) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		return async (_item: Proto['uiType']) => {
			try {
				const dbItem = await module.v1.upsert(_item).executeSync();
				await onCompleted?.(dbItem);
			} catch (e: any) {
				await onError?.(e);
			}
		};
	}

	/**
	 * Create a new instance of EditableDBItemV3 with the same properties and behaviors as the current instance.
	 *
	 * @param item The item of the new instance.
	 * @returns The new instance.
	 */
	clone(item?: Proto['dbType']): EditableDBItemV3<Proto> {
		return super.clone(item) as EditableDBItemV3<Proto>;
	}
}