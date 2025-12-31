import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {ModuleFE_BaseApi} from '@nu-art/thunderstorm-frontend/modules/db-api-gen/ModuleFE_BaseApi';
import {ApiStruct_EditableTest, DBDef_EditableTest, DBProto_EditableTest} from '@nu-art/thunderstorm-shared/_entity/editable-test/index';
import {ApiDefCaller} from '@nu-art/thunderstorm-shared/types';


export type DispatcherType_EditableTest = DispatcherDef<DBProto_EditableTest, `__onEditableTestUpdated`>;

export const dispatch_onEditableTestChanged = new ThunderDispatcherV3<DispatcherType_EditableTest>('__onEditableTestUpdated');

export class ModuleFE_EditableTest_Class
	extends ModuleFE_BaseApi<DBProto_EditableTest>
	implements ApiDefCaller<ApiStruct_EditableTest> {

	_v1: ApiDefCaller<ApiStruct_EditableTest>['_v1'];

	constructor() {
		super(DBDef_EditableTest, dispatch_onEditableTestChanged);
		this._v1 = {};
	}

}

export const ModuleFE_EditableTest = new ModuleFE_EditableTest_Class();

