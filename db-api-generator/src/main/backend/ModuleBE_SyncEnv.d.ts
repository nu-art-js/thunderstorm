import { Module, TypedMap } from '@nu-art/ts-common';
import { Request_FetchFromEnv } from '../shared';
type Config = {
    urlMap: TypedMap<string>;
};
declare class ModuleBE_SyncEnv_Class extends Module<Config> {
    constructor();
    fetchFromEnv: (body: Request_FetchFromEnv) => Promise<void>;
}
export declare const ModuleBE_SyncEnv: ModuleBE_SyncEnv_Class;
export {};
