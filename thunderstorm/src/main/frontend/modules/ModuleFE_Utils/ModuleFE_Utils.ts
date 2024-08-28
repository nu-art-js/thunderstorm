import {DB_Object, DBProto, Module} from '@nu-art/ts-common';
import React from 'react';

type Config = {};

// Base type for Renderer Params
interface BaseRendererParam<K extends string, P> {
	key: K;
	props: P;
}

// Type to create a mapper from Renderer Params
type RendererParams<T extends BaseRendererParam<string, any>> = {
	[K in T['key']]: Extract<T, { key: K }>['props'];
};

type AssertionCallbacksMapper<T extends DB_Object> = { [key: string]: (item: T) => any }

//TODO: re think about the typing in this class its far from perfect
class ModuleFE_Utils_Class<T extends BaseRendererParam<string, any>> extends Module<Config> {
	renderers: Partial<{ [K in T['key']]: React.ComponentType<any> }> = {};
	processors: Partial<AssertionCallbacksMapper<any>> = {};

	// renderers

	// Method to register a renderer
	registerRenderer<K extends string, P>(key: K, renderer: React.ComponentType<P>): ModuleFE_Utils_Class<BaseRendererParam<K, P>> {
		this.renderers[key] = renderer;
		return this as unknown as ModuleFE_Utils_Class<BaseRendererParam<K, P>>;
	}

	// Method to remove a renderer
	removeRenderer<K extends T['key']>(key: K): void {
		delete this.renderers[key];
	}

	// Method to get a renderer by key and pass props
	getRenderer<K extends T['key']>(key: K, props: RendererParams<T>[K]): React.ComponentType<RendererParams<T>[K]> {
		const renderer = this.renderers[key];
		if (!renderer) {
			throw new Error(`Renderer not found for key: ${key}`);
		}

		return renderer as React.ComponentType<typeof props>;
	}

	// assertion callbacks

	// Method to register a renderer
	registerProcessors<K extends string, T extends DBProto<any>>(key: K, assertionCallback: AssertionCallbacksMapper<T['dbType']>[K]): any {
		this.processors[key] = assertionCallback;
		return this;
	}

	// Method to remove a renderer
	removeProcessors<K extends T['key']>(key: K): void {
		delete this.processors[key];
	}

	// Method to get a renderer by key and pass props
	getProcessor<T extends DBProto<any>, K extends keyof AssertionCallbacksMapper<T['dbType']>>(key: K): AssertionCallbacksMapper<T['dbType']>[K] {
		const callback = this.processors[key];
		if (!callback) {
			throw new Error(`assertion callback not found for key: ${key}`);
		}

		return callback;
	}
}

export const ModuleFE_Utils = new ModuleFE_Utils_Class();