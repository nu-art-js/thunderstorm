import { Module } from '@nu-art/ts-common';
import { apiWithBody } from "@nu-art/thunder-db-api-frontend/index";
import { ApiDefCaller } from '@nu-art/thunder-db-api-shared';
import { ApiDef_OpenAI, ApiStruct_OpenAI } from '@nu-art/ts-openai-shared/api-def';
type Config = {};
export class ModuleFE_OpenAI_Class extends Module<Config> {
    readonly v1: ApiDefCaller<ApiStruct_OpenAI>['v1'];
    constructor() {
        super();
        this.v1 = {
            test: apiWithBody(ApiDef_OpenAI.v1.test),
        };
    }
    init() {
    }
}
export const ModuleFE_OpenAI = new ModuleFE_OpenAI_Class();
