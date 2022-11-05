import {EditableItem} from '@nu-art/thunderstorm/frontend';
import {DB_Object} from '@nu-art/ts-common';
import {BaseDB_ApiCaller} from '../modules/BaseDB_ApiCaller';


export class EditableDBItem<T extends DB_Object>
	extends EditableItem<T> {

	constructor(item: T, module: BaseDB_ApiCaller<T>) {
		super(item, () => module.v1.upsert(item).executeSync(), () => module.v1.delete(item).executeSync());
	}
}