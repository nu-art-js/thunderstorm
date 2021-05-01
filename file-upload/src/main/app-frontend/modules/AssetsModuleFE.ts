import {BaseDB_ApiGeneratorCaller} from "@nu-art/db-api-generator/frontend";

import {ThunderDispatcher} from "@nu-art/thunderstorm/frontend";
import {DB_Asset} from "../../shared/types";

export interface OnAssetsUpdated {
	__onAssetsUpdated: () => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class AssetsModuleFE_Class
	extends BaseDB_ApiGeneratorCaller<DB_Asset> {


	constructor() {
		super({key: "assets", relativeUrl: "/v1/assets"});
		this.setDefaultDispatcher(dispatch_onAssetsListChanged);
	}
}

export const AssetsModuleFE = new AssetsModuleFE_Class();
