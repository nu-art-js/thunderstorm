import {Module} from '@nu-art/ts-common';
import {ApiDef_Archiving, ApiDefCaller, ApiStruct_Archiving} from '../../../shared';
import {apiWithBody, apiWithQuery} from '../../core';

class ModuleFE_Archiving_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_Archiving>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			hardDeleteAll: apiWithQuery(ApiDef_Archiving.vv1.hardDeleteAll),
			hardDeleteUnique: apiWithBody(ApiDef_Archiving.vv1.hardDeleteUnique),
			getDocumentHistory: apiWithQuery(ApiDef_Archiving.vv1.getDocumentHistory)
		};
	}
}

export const ModuleFE_Archiving = new ModuleFE_Archiving_Class();