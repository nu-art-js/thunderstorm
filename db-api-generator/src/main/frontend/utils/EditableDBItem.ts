import {EditableItem} from '@nu-art/thunderstorm/frontend';
import {DB_Object, PreDB} from '@nu-art/ts-common';
import {DBItemApiCaller} from '../modules/types';


export class EditableDBItem<T extends DB_Object, Ks extends keyof T = '_id'>
	extends EditableItem<T> {

	constructor(item: Partial<T>, module: DBItemApiCaller<T, Ks>, onCompleted?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		super(item, EditableDBItem.save(module, onCompleted, onError), (_item) => module.v1.delete(_item).executeSync());
	}

	private static save<T extends DB_Object, Ks extends keyof T = '_id'>(module: DBItemApiCaller<T, Ks>, onCompleted?: (item: T) => any | Promise<any>, onError?: (err: Error) => any | Promise<any>) {
		return async (_item: PreDB<T>) => {
			try {
				const dbItem: T = await module.v1.upsert(_item).executeSync();
				await onCompleted?.(dbItem);
			} catch (e: any) {
				await onError?.(e);
			}
		};
	}

	clone(): EditableDBItem<T> {
		return super.clone() as EditableDBItem<T, Ks>;
	}

}