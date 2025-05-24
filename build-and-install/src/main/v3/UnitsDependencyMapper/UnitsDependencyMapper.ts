import {_keys, _values, Logger, sortArray, TypedMap} from '@nu-art/ts-common';

export type UnitDependentNode = {
	key: string;
	dependsOn: string[];
};

export class UnitsDependencyMapper
	extends Logger {
	private readonly map: TypedMap<UnitDependentNode> = {};

	constructor(units: UnitDependentNode[]) {
		super();
		for (const unit of units)
			this.map[unit.key] = {key: unit.key, dependsOn: unit.dependsOn};
	}

	public buildDependencyTree(allKeys = [..._keys(this.map)] as string[]): string[][] {
		const map = this.map;
		const dependentsMap: TypedMap<Set<string>> = {};
		const referencedKeys = new Set<string>();
		this.logVerbose(this.map);
		// 1. Build reverse dependency graph
		for (const key of _keys(map) as string[]) {
			const node = this.map[key];
			for (const dep of node.dependsOn) {
				let set = dependentsMap[dep];
				if (!set)
					dependentsMap[dep] = set = new Set();
				set.add(key);
				referencedKeys.add(dep);
			}
		}

		// 2. Identify bottom layer (depends on no one)
		const bottomLayer = allKeys.filter(key => map[key].dependsOn.length === 0);
		// 3. Identify top layer (no one depends on them)
		const topLayer = allKeys.filter(key =>
			!dependentsMap[key] && !bottomLayer.includes(key)
		);

		// 4. Build actual layers from bottom to top
		const resolved = new Set<string>(bottomLayer);
		const layers: string[][] = [sortArray(bottomLayer)];

		while (resolved.size < allKeys.length - topLayer.length) {
			const nextLayer: string[] = [];

			for (const key of _keys(this.map) as string[]) {
				const node = this.map[key];
				if (resolved.has(key) || topLayer.includes(key)) continue;

				if (node.dependsOn.every(dep => resolved.has(dep)))
					nextLayer.push(key);
			}

			if (nextLayer.length === 0) {
				this.logWarning(map);
				this.logWarning(layers);
				throw new Error('Cyclic or disconnected dependency detected');
			}

			nextLayer.sort();
			layers.push(nextLayer);
			nextLayer.forEach(k => resolved.add(k));
		}

		// 5. Add top layer last
		if (topLayer.length > 0)
			layers.push(sortArray(topLayer));

		return layers;
	}

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

	public getRoots(): string[] {
		const allKeys = new Set(_keys(this.map) as string[]);
		const dependedUpon = new Set<string>();
		for (const node of _values(this.map))
			for (const dep of node.dependsOn)
				dependedUpon.add(dep);
		return [...allKeys].filter(k => !dependedUpon.has(k)).sort();
	}

	public getLeaves(): string[] {
		return _values(this.map).filter(node => node.dependsOn.length === 0).map(node => node.key).sort();
	}
}