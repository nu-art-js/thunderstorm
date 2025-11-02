import {
	__stringify,
	_keys,
	_values,
	BadImplementationException,
	DateTimeFormat_yyyyMMDDTHHmmss, deepClone,
	Logger,
	reduceObject,
	sortArray,
	TypedMap
} from '@nu-art/ts-common';
import {FileSystemUtils} from '../core/FileSystemUtils.js';
import {resolve} from 'path';

export type UnitDependentNode = {
	key: string;
	dependsOn: string[];
};


/**
 * Maps unit dependencies and provides tools to analyze and operate on the dependency graph.
 */
export class UnitsDependencyMapper
	extends Logger {
	private readonly map: TypedMap<UnitDependentNode> = {};
	private pathToOutputFolder?: string;

	constructor(units: UnitDependentNode[], pathToOutputFolder?: string) {
		super();
		this.pathToOutputFolder = pathToOutputFolder;
		for (const unit of units)
			this.map[unit.key] = unit;

		for (const unit of units)
			for (const dep of unit.dependsOn)
				if (!this.map[dep])
					throw new BadImplementationException(`Unknown key: ${dep}, in unit: ${unit.key}`);
	}

	/**
	 * Builds dependency layers (bottom-to-top) from the provided keys.
	 * Filters out any non-participating units and prunes the graph accordingly.
	 */
	public async buildDependencyTree(participatingKeys = [..._keys(this.map)] as string[]): Promise<string[][]> {
		this.logDebug('Building dependency tree for: ', participatingKeys.sort());
		const dependentNodes = reduceObject(this.map, [] as UnitDependentNode[], (acc, key, value) => {
			acc.push(value);
			return acc;
		});
		this.logVerbose(dependentNodes);

		const allKnownKeys = _keys(this.map) as string[];
		const map = deepClone(this.map);
		for (const key of participatingKeys) {
			if (!map[key])
				throw new BadImplementationException(`Unknown key: ${key}`);
		}

		const notParticipatingKeys = allKnownKeys.filter(key => !participatingKeys.includes(key));
		for (const key of _keys(map) as string[]) {
			if (notParticipatingKeys.includes(key)) {
				delete map[key];
				continue;
			}

			const node = map[key];
			node.dependsOn = node.dependsOn.filter(dep => !notParticipatingKeys.includes(dep));
		}

		const dependentsMap: TypedMap<Set<string>> = {};
		const referencedKeys = new Set<string>();
		this.logVerbose(map);
		// 1. Build reverse dependency graph
		for (const key of _keys(map) as string[]) {
			const node = map[key];
			for (const dep of node.dependsOn) {
				let set = dependentsMap[dep];
				if (!set)
					dependentsMap[dep] = set = new Set();
				set.add(key);
				referencedKeys.add(dep);
			}
		}

		// 2. Identify bottom layer (depends on no one)
		const bottomLayer = (_keys(map) as string[]).filter(key => map[key].dependsOn.length === 0);

		// 3. Identify top layer (no one depends on them)
		const topLayer = (_keys(map) as string[]).filter(key => !dependentsMap[key] && !bottomLayer.includes(key));

		// 4. Build actual layers from bottom to top
		const resolved = new Set<string>(bottomLayer);

		const layers: string[][] = [];
		if (bottomLayer.length > 0)
			layers.push(sortArray(bottomLayer));

		while (resolved.size < participatingKeys.length - topLayer.length) {
			const nextLayer: string[] = [];

			for (const key of _keys(map) as string[]) {
				const node = map[key];
				if (resolved.has(key) || topLayer.includes(key)) continue;

				if (node.dependsOn.every(dep => resolved.has(dep)))
					nextLayer.push(key);
			}

			if (nextLayer.length === 0) {
				this.logWarning(participatingKeys);
				this.logWarning(map);
				this.logWarning(layers);
				throw new Error('Cyclic or disconnected dependency detected');
			}

			nextLayer.sort();
			layers.push(sortArray(nextLayer));
			nextLayer.forEach(k => resolved.add(k));
		}

		// 5. Add top layer last
		if (topLayer.length > 0)
			layers.push(sortArray(topLayer));


		if (this.pathToOutputFolder)
			await FileSystemUtils.file.write(resolve(this.pathToOutputFolder, `./dependency-tree-calc-${DateTimeFormat_yyyyMMDDTHHmmss.format()}.json`), __stringify({
				unitKeys: participatingKeys,
				dependencies: dependentNodes,
				output: layers,
			}));
		this.logDebug('Dependency tree:', layers);
		return layers;
	}

	/**
	 * Pretty-prints the dependency graph in a visual tree structure.
	 */
	public printGraph(): void {
		console.log('');

		// key -> list of dependencies (sorted)
		const dependsOnMap = new Map<string, string[]>();
		for (const key of _keys(this.map) as string[]) {
			const node = this.map[key];
			dependsOnMap.set(key, [...node.dependsOn].sort());
		}

		// Build reverse index to detect root nodes
		const allKeys = _keys(this.map) as string[];
		const referencedKeys = new Set<string>();
		for (const deps of dependsOnMap.values())
			deps.forEach(dep => referencedKeys.add(dep));

		// Root nodes: those no one depends on
		const rootNodes = allKeys
			.filter(k => !referencedKeys.has(k))
			.sort();

		const visited = new Set<string>();
		for (const root of rootNodes) {
			console.log(`◉ ${root}`);
			visited.add(root);

			const children = dependsOnMap.get(root) ?? [];
			for (let i = 0; i < children.length; i++) {
				const isLast = i === children.length - 1;
				this.printNodeRecursive(children[i], dependsOnMap, visited, '', isLast);
			}
		}

		// Handle disconnected/unreferenced nodes
		for (const key of allKeys.sort()) {
			if (!visited.has(key)) {
				console.log(`\n◉ ${key} (unlinked)`);
				this.printNodeRecursive(key, dependsOnMap, visited, '', true);
			}
		}
	}

	/**
	 * Filters units by resolving full downstream dependencies from given targets,
	 * excluding explicitly excluded units.
	 */
	public filterForTargets(included: string[], excluded: string[] = []): UnitDependentNode[] {
		const visited = new Set<string>();
		const toExclude = new Set(excluded);
		const stack = [...included];

		while (stack.length > 0) {
			const key = stack.pop()!;
			if (visited.has(key) || toExclude.has(key)) continue;

			const node = this.map[key];
			if (!node)
				throw new Error(`Unknown unit: ${key}`);

			visited.add(key);
			for (const dep of node.dependsOn)
				stack.push(dep);
		}

		// Return only units that were visited and not excluded
		return [..._values(this.map)]
			.filter(node => visited.has(node.key) && !toExclude.has(node.key));
	}

	private printNodeRecursive(
		node: string,
		graph: Map<string, string[]>,
		visited: Set<string>,
		prefix: string,
		isLast: boolean
	): void {
		const connector = isLast ? '└── ' : '├── ';
		console.log(`${prefix}${connector}${node}`);
		visited.add(node);

		const children = graph.get(node) ?? [];
		const newPrefix = prefix + (isLast ? '    ' : '│   ');

		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const childIsLast = i === children.length - 1;
			this.printNodeRecursive(child, graph, visited, newPrefix, childIsLast);
		}
	}

	/**
	 * Given a set of changed keys, returns all upstream dependents (reverse dependencies).
	 */
	public getReverseDependencies(changedKeys: string[], strict = true): string[] {
		const dependentsMap = new Map<string, Set<string>>();
		for (const key of _keys(this.map) as string[]) {
			const node = this.map[key];
			for (const dep of node.dependsOn) {
				if (!dependentsMap.has(dep))
					dependentsMap.set(dep, new Set());
				dependentsMap.get(dep)!.add(key);
			}
		}

		const visited = new Set<string>();
		const stack = [...changedKeys];

		while (stack.length > 0) {
			const key = stack.pop()!;
			if (!this.map[key]) {
				if (strict)
					throw new Error(`Unknown unit: ${key}`);
				continue;
			}
			if (visited.has(key)) continue;
			visited.add(key);
			const dependents = dependentsMap.get(key);
			if (dependents)
				stack.push(...dependents);
		}

		return Array.from(visited);
	}

	/**
	 * Recursively gathers all transitive dependencies of given units (excluding the keys themselves).
	 */
	public getTransitiveDependencies(key: string[]): string[] {
		const visited = new Set<string>();
		const stack = [...key];

		while (stack.length > 0) {
			const current = stack.pop()!;
			if (visited.has(current))
				continue;

			visited.add(current);
			const node = this.map[current];
			if (!node)
				throw new Error(`Unit '${current}' not found in dependency map.`);
			stack.push(...node.dependsOn);
		}

		key.forEach(_key => visited.delete(_key));
		return [...visited];
	}

	/**
	 * Returns all detected cycles in the graph as ordered lists of unit keys.
	 */
	public detectCycles(): string[][] {
		const visited = new Set<string>();
		const inStack = new Set<string>();
		const cycles: string[][] = [];

		const visit = (key: string, path: string[]): void => {
			if (inStack.has(key)) {
				const cycleStart = path.indexOf(key);
				cycles.push(path.slice(cycleStart).concat(key));
				return;
			}
			if (visited.has(key)) return;

			visited.add(key);
			inStack.add(key);
			const node = this.map[key];
			if (node)
				for (const dep of node.dependsOn)
					visit(dep, path.concat(key));
			inStack.delete(key);
		};

		for (const key of _keys(this.map) as string[])
			visit(key, []);

		return cycles;
	}

	/**
	 * Checks if there is a dependency path from one unit to another.
	 */
	public isReachable(from: string, to: string): boolean {
		const visited = new Set<string>();
		const stack = [from];

		while (stack.length > 0) {
			const key = stack.pop()!;
			if (key === to) return true;
			if (visited.has(key)) continue;
			visited.add(key);
			const node = this.map[key];
			if (node)
				stack.push(...node.dependsOn);
		}

		return false;
	}

	/**
	 * Returns all root units (not depended on by any other units).
	 */
	public getRoots(): string[] {
		const allKeys = new Set(_keys(this.map) as string[]);
		const dependedUpon = new Set<string>();
		for (const node of _values(this.map))
			for (const dep of node.dependsOn)
				dependedUpon.add(dep);
		return [...allKeys].filter(k => !dependedUpon.has(k)).sort();
	}

	/**
	 * Returns all leaf units (those with no dependencies).
	 */
	public getLeaves(): string[] {
		return _values(this.map).filter(node => node.dependsOn.length === 0).map(node => node.key).sort();
	}
}