import {ApiDefCaller} from '@nu-art/thunderstorm';
import {Module} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery} from '@nu-art/thunderstorm/frontend';
import {ApiDef_Archiving, ApiStruct_Archiving} from '../../shared/archiving/apis';

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