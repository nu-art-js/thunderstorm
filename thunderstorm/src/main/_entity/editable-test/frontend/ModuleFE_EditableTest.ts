import {DispatcherDef, ThunderDispatcherV3} from '../../../frontend/core/db-api-gen/v3_types';
import {ApiStruct_EditableTest, DBDef_EditableTest, DBProto_EditableTest} from '../shared';
import {ApiDefCaller} from '../../../shared';
import { ModuleFE_v3_BaseApi } from '../../../frontend/modules/db-api-gen/ModuleFE_v3_BaseApi';


export type DispatcherType_EditableTest = DispatcherDef<DBProto_EditableTest, `__onEditableTestUpdated`>;

export const dispatch_onEditableTestChanged = new ThunderDispatcherV3<DispatcherType_EditableTest>('__onEditableTestUpdated');

export class ModuleFE_EditableTest_Class
	extends ModuleFE_v3_BaseApi<DBProto_EditableTest>
	implements ApiDefCaller<ApiStruct_EditableTest> {

	_v1: ApiDefCaller<ApiStruct_EditableTest>['_v1'];

	constructor() {
		super(DBDef_EditableTest, dispatch_onEditableTestChanged);
		this._v1 = {
		};
	}

}

export const ModuleFE_EditableTest = new ModuleFE_EditableTest_Class();

