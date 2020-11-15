import {BaseDB_ApiGenerator} from "@nu-art/db-api-generator/app-backend/BaseDB_ApiGenerator";
import {
	TypeValidator,
	validateExists
} from "@nu-art/ts-common";
import {ServerApi} from "@nu-art/thunderstorm/app-backend/modules/server/server-api";
import {
	ServerApi_Create,
	ServerApi_Query,
	ServerApi_Unique,
	ServerApi_Update
} from "@nu-art/db-api-generator/app-backend/apis";
import {DB_AnalyticEvent} from "../..";

export const CollectionName_Configs = "analytics";

export class AnalyticModule_Class
	extends BaseDB_ApiGenerator<DB_AnalyticEvent> {

	static _validator: TypeValidator<DB_AnalyticEvent> = {
		_id: validateExists(true),
		eventName: validateExists(true),
		timestamp: validateExists(true),
		user: undefined,
		screen: undefined,
		eventParams: undefined
	};

	constructor() {
		super(CollectionName_Configs, AnalyticModule_Class._validator, "analytic");
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [
			new ServerApi_Create(this, pathPart),
			new ServerApi_Unique(this, pathPart),
			new ServerApi_Update(this, pathPart),
			new ServerApi_Query(this, pathPart)
		];
	}

}

export const AnalyticModule = new AnalyticModule_Class();
