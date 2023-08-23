import { Logger, TypedKeyValue } from '@nu-art/ts-common';
import { ModuleBE_BaseDBV2 } from './ModuleBE_BaseDBV2';
import { DB_AppConfig } from '../shared/app-config';
type InferType<T> = T extends AppConfigKey_BE<infer ValueType> ? ValueType : never;
declare class ModuleBE_AppConfig_Class extends ModuleBE_BaseDBV2<DB_AppConfig> {
    private keyMap;
    constructor();
    registerKey<K extends AppConfigKey_BE<any>>(appConfigKey: K): void;
    getResolverDataByKey(key: string): Promise<any>;
    createDefaults: (logger?: Logger) => Promise<void>;
    getAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K): Promise<InferType<K>>;
    setAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K, data: InferType<K>): Promise<DB_AppConfig>;
    _deleteAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K): Promise<void>;
}
export declare const ModuleBE_AppConfig: ModuleBE_AppConfig_Class;
export declare class AppConfigKey_BE<Binder extends TypedKeyValue<string | number | object, any>> {
    readonly key: Binder['key'];
    readonly resolver: () => Promise<Binder['value']>;
    constructor(key: Binder['key'], resolver: () => Promise<Binder['value']>);
    get(): Promise<Binder['value']>;
    set(value: Binder['value']): Promise<void>;
    delete(): Promise<void>;
}
export {};
