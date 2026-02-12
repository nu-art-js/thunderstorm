/*
 * @nu-art/thunder-core - Thunderstorm core types: dispatcher and mouse utilities
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Dispatcher, FunctionKeys, LogLevel, ParamResolver, ReturnTypeResolver} from '@nu-art/ts-common';

export class ThunderDispatcher<T,
	K extends FunctionKeys<T>,
	P extends ParamResolver<T, K> = ParamResolver<T, K>,
	R extends ReturnTypeResolver<T, K> = ReturnTypeResolver<T, K>>
	extends Dispatcher<T, K, P, R> {

	static MinLogLevel = LogLevel.Info;

	static listenersResolver: () => any[] = () => [];

	private cache?: P;
	private allowCache: boolean;

	constructor(method: K, allowCache = false) {
		super(method);
		this.allowCache = allowCache;
		this.setMinLevel(ThunderDispatcher.MinLogLevel);
	}

	getCachedData() {
		return this.cache;
	}

	public dispatchUI(...p: P): R[] {
		if (this.allowCache)
			this.cache = p;

		this.logDebug('Dispatching (Sync): ', p);
		const listeners = ThunderDispatcher.listenersResolver();
		return listeners.filter(this.filter).map((listener: T) => {
			// @ts-ignore - dynamic method call
			return listener[this.method](...p);
		});
	}

	public async dispatchUIAsync(...p: P): Promise<R[]> {
		if (this.allowCache)
			this.cache = p;

		this.logDebug('Dispatching (Async): ', p);
		const listeners = ThunderDispatcher.listenersResolver();
		return Promise.all(listeners.filter(this.filter).map(async (listener: T) => {
			// @ts-ignore - dynamic method call
			return listener[this.method](...p);
		}));
	}

	public dispatchAll(...p: P): R[] {
		const moduleResponses = this.dispatchModule(...p);
		const uiResponses = this.dispatchUI(...p);
		return [...moduleResponses, ...uiResponses];
	}

	public async dispatchAllAsync(...p: P): Promise<R[]> {
		const listenersUI = ThunderDispatcher.listenersResolver();
		const listenersModules = Dispatcher.modulesResolver?.() ?? [];

		return Promise.all([...listenersUI, ...listenersModules].filter(this.filter).map(async (listener: T) => {
			// @ts-ignore - dynamic method call
			return listener[this.method](...p);
		}));
	}
}
