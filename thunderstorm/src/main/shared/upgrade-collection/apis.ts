import {ApiDefResolver, BodyApi, HttpMethod} from '../types';
import {Minute} from '@thunder-storm/common';


export type Request_UpgradeCollections = { collectionsToUpgrade: string[], force?: boolean };
export type ApiStruct_UpgradeCollection = {
	vv1: {
		upgrade: BodyApi<void, Request_UpgradeCollections>
		upgradeAll: BodyApi<void, Request_UpgradeCollections> // Upgrades if needed
	}
}

export const ApiDef_UpgradeCollection: ApiDefResolver<ApiStruct_UpgradeCollection> = {
	vv1: {
		upgrade: {method: HttpMethod.POST, path: 'v1/upgrade-collection', timeout: 5 * Minute},
		upgradeAll: {method: HttpMethod.POST, path: 'v1/upgrade-all-collections', timeout: 10 * Minute},
	}
};