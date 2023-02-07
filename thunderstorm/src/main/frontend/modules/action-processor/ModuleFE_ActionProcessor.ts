import {Module} from '@nu-art/ts-common';
import {ApiDefCaller} from '../../shared';
import {ApiDef_ActionProcessing, ApiStruct_ActionProcessing} from '../../../shared/action-processor';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';


class ModuleFE_ActionProcessor_Class
	extends Module {

	readonly vv1: ApiDefCaller<ApiStruct_ActionProcessing>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			execute: apiWithBody(ApiDef_ActionProcessing.vv1.execute),
			list: apiWithQuery(ApiDef_ActionProcessing.vv1.list),
		};
	}
}

export const ModuleFE_ActionProcessor = new ModuleFE_ActionProcessor_Class();