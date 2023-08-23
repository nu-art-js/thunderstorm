import { ApiDefCaller } from '@nu-art/thunderstorm';
import { ThunderDispatcher } from '@nu-art/thunderstorm/frontend';
import { TypedKeyValue, TypedMap } from '@nu-art/ts-common';
import { ApiStruct_AppConfig, DB_AppConfig } from '../../shared/app-config';
import { ApiCallerEventType } from './types';
import { ModuleFE_BaseApi } from './ModuleFE_BaseApi';
type InferType<T> = T extends AppConfigKey_FE<infer ValueType> ? ValueType : never;
export interface OnAppConfigUpdated {
    __OnAppConfigUpdated: (...params: ApiCallerEventType<DB_AppConfig>) => void;
}
export declare const dispatch_onAppConfigUpdated: ThunderDispatcher<OnAppConfigUpdated, "__OnAppConfigUpdated", ApiCallerEventType<DB_AppConfig>, void>;
export declare class ModuleFE_AppConfig_Class extends ModuleFE_BaseApi<DB_AppConfig> {
    readonly vv1: ApiDefCaller<ApiStruct_AppConfig>['vv1'];
    appConfig: TypedMap<DB_AppConfig>;
    constructor();
    init(): Promise<void>;
    get<K extends AppConfigKey_FE<any>>(appConfigKey: K): InferType<K>;
    set<K extends AppConfigKey_FE<any>>(appConfigKey: K, data: InferType<K>): Promise<void>;
    delete<K extends AppConfigKey_FE<any>>(appConfigKey: K): Promise<void>;
}
export declare const ModuleFE_AppConfig: ModuleFE_AppConfig_Class;
export declare class AppConfigKey_FE<Binder extends TypedKeyValue<string, any>> {
    readonly key: Binder['key'];
    constructor(key: Binder['key']);
    get(): Binder['value'];
    set(value: Binder['value']): Promise<void>;
    delete(): Promise<void>;
}
export {};
