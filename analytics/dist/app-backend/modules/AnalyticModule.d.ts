import { BaseDB_ApiGenerator } from "@nu-art/db-api-generator/app-backend/BaseDB_ApiGenerator";
import { TypeValidator } from "@nu-art/ts-common";
import { ServerApi } from "@nu-art/thunderstorm/app-backend/modules/server/server-api";
import { DB_AnalyticEvent } from "../..";
export declare const CollectionName_Configs = "analytics";
export declare class AnalyticModule_Class extends BaseDB_ApiGenerator<DB_AnalyticEvent> {
    static _validator: TypeValidator<DB_AnalyticEvent>;
    constructor();
    apis(pathPart?: string): ServerApi<any>[];
}
export declare const AnalyticModule: AnalyticModule_Class;
