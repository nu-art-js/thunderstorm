/*
 * @nu-art/thunder-core - Thunderstorm core types: dispatcher and mouse utilities
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { Dispatcher, LogLevel } from '@nu-art/ts-common';
export class ThunderDispatcher extends Dispatcher {
    static MinLogLevel = LogLevel.Info;
    static listenersResolver = () => [];
    cache;
    allowCache;
    constructor(method, allowCache = false) {
        super(method);
        this.allowCache = allowCache;
        this.setMinLevel(ThunderDispatcher.MinLogLevel);
    }
    getCachedData() {
        return this.cache;
    }
    dispatchUI(...p) {
        if (this.allowCache)
            this.cache = p;
        this.logDebug('Dispatching (Sync): ', p);
        const listeners = ThunderDispatcher.listenersResolver();
        return listeners.filter(this.filter).map((listener) => {
            // @ts-ignore - dynamic method call
            return listener[this.method](...p);
        });
    }
    async dispatchUIAsync(...p) {
        if (this.allowCache)
            this.cache = p;
        this.logDebug('Dispatching (Async): ', p);
        const listeners = ThunderDispatcher.listenersResolver();
        return Promise.all(listeners.filter(this.filter).map(async (listener) => {
            // @ts-ignore - dynamic method call
            return listener[this.method](...p);
        }));
    }
    dispatchAll(...p) {
        const moduleResponses = this.dispatchModule(...p);
        const uiResponses = this.dispatchUI(...p);
        return [...moduleResponses, ...uiResponses];
    }
    async dispatchAllAsync(...p) {
        const listenersUI = ThunderDispatcher.listenersResolver();
        const listenersModules = Dispatcher.modulesResolver?.() ?? [];
        return Promise.all([...listenersUI, ...listenersModules].filter(this.filter).map(async (listener) => {
            // @ts-ignore - dynamic method call
            return listener[this.method](...p);
        }));
    }
}
