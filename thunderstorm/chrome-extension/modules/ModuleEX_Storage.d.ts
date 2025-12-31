/**
 * Created by tacb0ss on 27/07/2018.
 */
import { Module, TS_Object } from '@nu-art/ts-common';
export interface StorageKeyEvent {
    __onStorageKeyEvent(event: StorageEvent): void;
}
export declare class ModuleEX_Storage_Class extends Module {
    protected init(): void;
    getStorage: () => any;
    set(key: string, value: string | number | object): Promise<any>;
    delete(key: string): Promise<any>;
    get(key: string, defaultValue?: string | number | object): Promise<string | number | object | null>;
}
export declare const ModuleEX_Storage: ModuleEX_Storage_Class;
export declare class StorageKeyEX<ValueType = string | number | object> {
    private readonly key;
    constructor(key: string);
    get(defaultValue?: ValueType): Promise<ValueType>;
    patch(value: ValueType extends TS_Object ? Partial<ValueType> : ValueType): Promise<any>;
    set(value: ValueType): Promise<ValueType>;
    delete(): Promise<any>;
}
