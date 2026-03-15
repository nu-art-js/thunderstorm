import {API_EditableTest, DBDef_EditableTest, DatabaseDef_EditableTest} from '@nu-art/thunderstorm-shared/_entity/editable-test/index';
import {DispatcherDef, ThunderDispatcherV3} from '../../core/db-api-gen/types.js';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi.js';
import {ApiDefCaller} from '@nu-art/thunderstorm-shared/types';


export type DispatcherType_EditableTest = DispatcherDef<DatabaseDef_EditableTest, `__onEditableTestUpdated`>;

export const dispatch_onEditableTestChanged = new ThunderDispatcherV3<DispatcherType_EditableTest>('__onEditableTestUpdated');

export class ModuleFE_EditableTest_Class
	extends ModuleFE_BaseApi<DatabaseDef_EditableTest>
	implements ApiDefCaller<API_EditableTest> {

	_v1: ApiDefCaller<API_EditableTest>;

	constructor() {
		super(DBDef_EditableTest, dispatch_onEditableTestChanged);
		this._v1 = {};
	}

}

export const ModuleFE_EditableTest = new ModuleFE_EditableTest_Class();

