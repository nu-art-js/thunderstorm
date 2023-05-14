import {EditableItem} from '@nu-art/thunderstorm/frontend';
import {DB_Object, PreDB} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../modules/ModuleFE_BaseApi';


export class EditableDBItem<T extends DB_Object, Ks extends keyof T = '_id'>
	extends EditableItem<T> {

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

	clone(item?: T): EditableDBItem<T> {
		return super.clone(item) as EditableDBItem<T, Ks>;
	}

	// static editDBProp<K, O extends DB_Object>(editable: EditableItem<K>, key: keyof K, module: ModuleFE_BaseApi<O, any>, defaultValue: Partial<O>) {
	// 		if(editable.item[key])
	// 	return new EditableItem<NonNullable<O>>(
	// 		editable.item[key] || (editable.item[key] = defaultValue as NonNullable<T[K]>),
	// 		async (value: T[K]) => {
	// 			this.set(key, value);
	// 			return this.autoSave();
	// 		},
	// 		() => this.delete()).setAutoSave(true);
	// }
}