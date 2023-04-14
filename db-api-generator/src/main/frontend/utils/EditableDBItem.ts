import {EditableItem} from '@nu-art/thunderstorm/frontend';
import {DB_Object} from '@nu-art/ts-common';
import {BaseDB_ApiCaller} from '../modules/BaseDB_ApiCaller';
import {BaseDB_ApiCallerV2} from '../modules/BaseDB_ApiCallerV2';


type ApiCaller<T extends DB_Object, Ks extends keyof T = '_id'> = BaseDB_ApiCaller<T, Ks> | BaseDB_ApiCallerV2<T, Ks>;

export class EditableDBItem<T extends DB_Object, Ks extends keyof T = '_id'>
	extends EditableItem<T> {

	constructor(item: T, module: ApiCaller<T, Ks>, onCompleted?: (err?: Error) => any | Promise<any>) {
		super(item, (_item) => module.v1.upsert(_item).executeSync(), (_item) => module.v1.delete(_item).executeSync(), onCompleted);
	}

	clone(): EditableDBItem<T> {
		return super.clone() as EditableDBItem<T, Ks>;
	}

}