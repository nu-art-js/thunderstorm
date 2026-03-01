/*
 * Injectable renderer registry so permissions frontend does not depend on thunderstorm ModuleFE_Utils.
 * The host app can set a registry that forwards to its own renderer system.
 */

import type {ComponentType} from 'react';

export type RendererRegistry = {
	registerRenderer(key: string, component: ComponentType<any>): void;
};

let rendererRegistry: RendererRegistry | null = null;

export function setRendererRegistry(registry: RendererRegistry | null): void {
	rendererRegistry = registry;
}

export function getRendererRegistry(): RendererRegistry | null {
	return rendererRegistry;
}
