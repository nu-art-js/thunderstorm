/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Logger, Module} from '@nu-art/ts-common';
import type {ServiceAccountDef} from '@nu-art/permissions-shared';

/** Injectable app-config key handler. When using @nu-art/app-config-backend, set this so PermissionKey_BE registers and delegates get/set. */
export type AppConfigKeyHandler = {
	registerKey(key: { key: string | number; resolver: (logger: Logger) => Promise<unknown>; dataManipulator: (data: unknown) => Promise<unknown> }): void;
	getAppKey(key: { key: string | number }, logger?: Logger): Promise<unknown>;
	setAppKey(key: { key: string | number }, value: unknown): Promise<void>;
};

let appConfigKeyHandler: AppConfigKeyHandler | null = null;

export function setAppConfigKeyHandler(handler: AppConfigKeyHandler | null): void {
	appConfigKeyHandler = handler;
}

export function getAppConfigKeyHandler(): AppConfigKeyHandler | null {
	return appConfigKeyHandler;
}

export type EnvConfigRef = {
	get(config: Record<string, unknown>): Promise<Record<string, unknown>>;
	set(config: Record<string, unknown>): Promise<void>;
};

let envConfigRefByModule: Map<Module, EnvConfigRef> = new Map();
let globalEnvConfigRef: EnvConfigRef | null = null;
let createPermissionKeyDefaultsFn: ((module: Module) => Promise<void>) | null = null;
let actionProcessor: {
	registerAction(opts: { key: string; group: string; description: string; processor: () => Promise<void> }, thisArg: unknown): void
} | null = null;
let serviceAccountsProvider: (() => Promise<ServiceAccountDef[]>) | null = null;

export function setEnvConfigRefForModule(module: Module, ref: EnvConfigRef): void {
	envConfigRefByModule.set(module, ref);
}

export function getEnvConfigRef(module: Module): EnvConfigRef | null {
	return envConfigRefByModule.get(module) ?? null;
}

export function setGlobalEnvConfigRef(ref: EnvConfigRef | null): void {
	globalEnvConfigRef = ref;
}

export function getGlobalEnvConfigRef(): EnvConfigRef | null {
	return globalEnvConfigRef;
}

export function setCreatePermissionKeyDefaults(fn: ((module: Module) => Promise<void>) | null): void {
	createPermissionKeyDefaultsFn = fn;
}

export function getCreatePermissionKeyDefaults(): ((module: Module) => Promise<void>) | null {
	return createPermissionKeyDefaultsFn;
}

export function setActionProcessor(proc: {
	registerAction(opts: { key: string; group: string; description: string; processor: () => Promise<void> }, thisArg: unknown): void
} | null): void {
	actionProcessor = proc;
}

export function getActionProcessor(): {
	registerAction(opts: { key: string; group: string; description: string; processor: () => Promise<void> }, thisArg: unknown): void
} | null {
	return actionProcessor;
}

export function setServiceAccountsProvider(provider: (() => Promise<ServiceAccountDef[]>) | null): void {
	serviceAccountsProvider = provider;
}

export function getServiceAccountsProvider(): (() => Promise<ServiceAccountDef[]>) | null {
	return serviceAccountsProvider;
}
