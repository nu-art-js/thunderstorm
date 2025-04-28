import {sortArray} from '@nu-art/ts-common';

export type UnitDependentNode = {
	key: string;
	dependsOn: string[];
};

export class UnitsDependencyMapper {
	private readonly map: Map<string, UnitDependentNode> = new Map();

	constructor(units: UnitDependentNode[]) {
		for (const unit of units)
			this.map.set(unit.key, {key: unit.key, dependsOn: unit.dependsOn});
	}

	public buildDependencyTree(): string[][] {
		const map = this.map;
		const allKeys = [...map.keys()];
		const dependentsMap = new Map<string, Set<string>>();
		const referencedKeys = new Set<string>();

		// 1. Build reverse dependency graph
		for (const [key, node] of map) {
			for (const dep of node.dependsOn) {
				if (!dependentsMap.has(dep))
					dependentsMap.set(dep, new Set());
				dependentsMap.get(dep)!.add(key);
				referencedKeys.add(dep);
			}
		}

		// 2. Identify bottom layer (depends on no one)
		const bottomLayer = allKeys.filter(key => map.get(key)!.dependsOn.length === 0);
		// 3. Identify top layer (no one depends on them)
		const topLayer = allKeys.filter(key =>
			!dependentsMap.has(key) && !bottomLayer.includes(key)
		);

		// 4. Build actual layers from bottom to top
		const resolved = new Set<string>(bottomLayer);
		const layers: string[][] = [sortArray(bottomLayer)];

		while (resolved.size < allKeys.length - topLayer.length) {
			const nextLayer: string[] = [];

			for (const [key, node] of map.entries()) {
				if (resolved.has(key) || topLayer.includes(key)) continue;

				if (node.dependsOn.every(dep => resolved.has(dep)))
					nextLayer.push(key);
			}

			if (nextLayer.length === 0)
				throw new Error('Cyclic or disconnected dependency detected');

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
		for (const [key, node] of this.map.entries())
			dependsOnMap.set(key, [...node.dependsOn].sort());

		// Build reverse index to detect root nodes
		const allKeys = [...this.map.keys()];
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

			const node = this.map.get(key);
			if (!node)
				throw new Error(`Unknown unit: ${key}`);

			visited.add(key);
			for (const dep of node.dependsOn)
				stack.push(dep);
		}

		// Return only units that were visited and not excluded
		return [...this.map.values()]
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

	public getReverseDependencies(changedKeys: string[], strict = true): UnitDependentNode[] {
		const dependentsMap = new Map<string, Set<string>>();
		for (const [key, node] of this.map.entries()) {
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
			if (!this.map.has(key)) {
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

		return [...this.map.values()].filter(node => visited.has(node.key));
	}
}