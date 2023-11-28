import {ApiDefResolver, BodyApi, HttpMethod} from '../types';
import {Minute} from '@nu-art/ts-common';


export type ApiStruct_UpgradeCollection = {
	vv1: {
		upgrade: BodyApi<void, { collectionsToUpgrade: string[] }>
	}
}

export const ApiDef_UpgradeCollection: ApiDefResolver<ApiStruct_UpgradeCollection> = {
	vv1: {
		upgrade: {method: HttpMethod.POST, path: 'v1/upgrade-collection', timeout: 5 * Minute},
	}
};