import { Dispatcher, FunctionKeys, LogLevel, ParamResolver, ReturnTypeResolver } from '@nu-art/ts-common';
export declare class ThunderDispatcher<T, K extends FunctionKeys<T>, P extends ParamResolver<T, K> = ParamResolver<T, K>, R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>> extends Dispatcher<T, K, P, R> {
    static MinLogLevel: LogLevel;
    static listenersResolver: () => any[];
    private cache?;
    private allowCache;
    constructor(method: K, allowCache?: boolean);
    getCachedData(): P | undefined;
    dispatchUI(...p: P): R[];
    dispatchUIAsync(...p: P): Promise<R[]>;
    dispatchAll(...p: P): R[];
    dispatchAllAsync(...p: P): Promise<R[]>;
}
