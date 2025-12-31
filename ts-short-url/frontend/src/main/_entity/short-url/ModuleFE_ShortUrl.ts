import { ApiDef_ShortUrl, ApiStruct_ShortUrl, DBDef_ShortUrl, DBProto_ShortUrl } from '@nu-art/ts-short-url-shared';
import { DispatcherDef, ThunderDispatcherV3 } from '@nu-art/thunder-db-api-frontend';
import { apiWithQuery, ModuleFE_BaseApi } from "@nu-art/thunder-db-api-frontend/index";
import { ApiDefCaller } from '@nu-art/thunder-db-api-shared';
export type DispatcherType_ShortUrl = DispatcherDef<DBProto_ShortUrl, `__onShortUrlsUpdated`>;
export const dispatch_onShortUrlsUpdated = new ThunderDispatcherV3<DispatcherType_ShortUrl>('__onShortUrlsUpdated');
export class ModuleFE_ShortUrl_Class extends ModuleFE_BaseApi<DBProto_ShortUrl> implements ApiDefCaller<ApiStruct_ShortUrl> {
    _v1: ApiDefCaller<ApiStruct_ShortUrl>['_v1'];
    constructor() {
        super(DBDef_ShortUrl, dispatch_onShortUrlsUpdated);
        this._v1 = {
            getShortUrl: apiWithQuery(ApiDef_ShortUrl._v1.getShortUrl)
        };
    }
}
export const ModuleFE_ShortUrl = new ModuleFE_ShortUrl_Class();
