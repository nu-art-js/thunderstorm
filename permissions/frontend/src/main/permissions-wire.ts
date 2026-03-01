/*
 * Injectable renderer registry and app-config key handler so permissions frontend does not depend on thunderstorm.
 * Use @nu-art/app-config-frontend when available; until then the host app can set get/set via setAppConfigKeyHandler.
 */

import type {ComponentType} from 'react';

export type RendererRegistry = {
	registerRenderer(key: string, component: ComponentType<any>): void;
};

export type AppConfigKeyHandler = {
	get<T>(key: string): T | undefined;
	set<T>(key: string, value: T): Promise<void>;
};

let rendererRegistry: RendererRegistry | null = null;
let appConfigKeyHandler: AppConfigKeyHandler | null = null;

export function setRendererRegistry(registry: RendererRegistry | null): void {
	rendererRegistry = registry;
}

export function getRendererRegistry(): RendererRegistry | null {
	return rendererRegistry;
}

export function setAppConfigKeyHandler(handler: AppConfigKeyHandler | null): void {
	appConfigKeyHandler = handler;
}

export function getAppConfigKeyHandler(): AppConfigKeyHandler | null {
	return appConfigKeyHandler;
}
