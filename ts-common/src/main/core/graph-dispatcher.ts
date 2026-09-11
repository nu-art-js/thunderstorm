/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Brand, FunctionKeys} from '../utils/types.js';
import {BadImplementationException} from './exceptions/exceptions.js';
import {Logger} from './logger/index.js';

type GraphParamResolver<Type, Key extends keyof Type> =
	Type[Key] extends (...args: any) => any ? Parameters<Type[Key]> : never;

/**
 * Branded node id for a GraphDispatcher. Import the key, never the module class.
 */
export type DispatchKey = Brand<string, 'DispatchKey'>;

export const asDispatchKey = (key: string): DispatchKey => key as DispatchKey;

export type GraphNodeSpec<P extends any[] = any[]> = {
	key: DispatchKey;
	runAfter?: DispatchKey[];
	runBefore?: DispatchKey[];
	run: (...p: P) => unknown | Promise<unknown>;
};

type GraphNode<P extends any[] = any[]> = {
	key: DispatchKey;
	runAfter: DispatchKey[];
	runBefore: DispatchKey[];
	run: (...p: P) => unknown | Promise<unknown>;
};

/**
 * Opt-in ordered dispatch. Completely separate from Dispatcher:
 * this class never scans RuntimeModules; Dispatcher never reads these nodes.
 *
 * @OnDispatch(graph, spec) registers on instance construct (ApiHandler pattern).
 * Method name must be the graph's __xxxxx.
 */
export class GraphDispatcher<T,
	K extends FunctionKeys<T>,
	P extends GraphParamResolver<T, K> = GraphParamResolver<T, K>>
	extends Logger {

	private readonly nodes: GraphNode<P>[] = [];

	public constructor(readonly method: K) {
		super(String(method));
	}

	public register(spec: GraphNodeSpec<P>): void {
		if (this.nodes.some(node => node.key === spec.key))
			throw new BadImplementationException(`Duplicate DispatchKey: '${spec.key}'`);

		this.nodes.push({
			key: spec.key,
			runAfter: [...(spec.runAfter ?? [])],
			runBefore: [...(spec.runBefore ?? [])],
			run: spec.run,
		});
	}

	/**
	 * Kahn levels from runAfter / runBefore. Same level runs in parallel.
	 * Empty graph is a no-op.
	 */
	public async dispatch(...p: P): Promise<void> {
		const levels = this.topoLevels();
		for (const level of levels)
			await Promise.all(level.map(node => node.run(...p)));
	}

	private topoLevels(): GraphNode<P>[][] {
		if (this.nodes.length === 0)
			return [];

		const nodeByKey = new Map<DispatchKey, GraphNode<P>>();
		const inDegree = new Map<DispatchKey, number>();
		const outgoing = new Map<DispatchKey, DispatchKey[]>();

		for (const node of this.nodes) {
			nodeByKey.set(node.key, node);
			inDegree.set(node.key, 0);
			outgoing.set(node.key, []);
		}

		const addEdge = (from: DispatchKey, to: DispatchKey, writer: DispatchKey) => {
			if (!nodeByKey.has(from))
				throw new BadImplementationException(`DispatchKey '${writer}' references unknown key '${from}'`);

			if (!nodeByKey.has(to))
				throw new BadImplementationException(`DispatchKey '${writer}' references unknown key '${to}'`);

			outgoing.get(from)!.push(to);
			inDegree.set(to, inDegree.get(to)! + 1);
		};

		for (const node of this.nodes) {
			for (const prerequisite of node.runAfter)
				addEdge(prerequisite, node.key, node.key);

			for (const successor of node.runBefore)
				addEdge(node.key, successor, node.key);
		}

		const levels: GraphNode<P>[][] = [];
		let ready = this.nodes.filter(node => inDegree.get(node.key) === 0);
		let processed = 0;

		while (ready.length > 0) {
			levels.push(ready);
			processed += ready.length;

			const nextReady: GraphNode<P>[] = [];
			for (const node of ready) {
				for (const nextKey of outgoing.get(node.key)!) {
					const nextDegree = inDegree.get(nextKey)! - 1;
					inDegree.set(nextKey, nextDegree);
					if (nextDegree === 0)
						nextReady.push(nodeByKey.get(nextKey)!);
				}
			}

			ready = nextReady;
		}

		if (processed !== this.nodes.length)
			throw new BadImplementationException('Cycle detected in GraphDispatcher');

		return levels;
	}
}

export type OnDispatchSpec = {
	key: DispatchKey;
	runAfter?: DispatchKey[];
	runBefore?: DispatchKey[];
};

/**
 * TC39 method decorator. First arg is the GraphDispatcher (not Dispatcher).
 * Registers the bound method on instance construct.
 */
export function OnDispatch<T, K extends FunctionKeys<T>, Module>(
	dispatcher: GraphDispatcher<T, K>,
	spec: OnDispatchSpec,
) {
	return function <This extends Module, Return>(
		originalMethod: (this: This, ...args: GraphParamResolver<T, K>) => Return,
		context: ClassMethodDecoratorContext<This>,
	): (this: This, ...args: GraphParamResolver<T, K>) => Return {
		if (context.name !== dispatcher.method)
			throw new BadImplementationException(
				`OnDispatch(${String(dispatcher.method)}): method must be named ${String(dispatcher.method)}`,
			);

		context.addInitializer(function (this: This) {
			dispatcher.register({
				key: spec.key,
				runAfter: spec.runAfter,
				runBefore: spec.runBefore,
				run: (...p) => originalMethod.call(this, ...p),
			});
		});

		return originalMethod;
	};
}
