export type RegistryScope = 'all' | 'pinned' | 'recent';
export type RegistryGroupBy = 'category' | 'az' | 'recent';

export type RegistryItem = {
	key: string;
	name: string;
	group: string;
	description: string;
};

export type RegistryGroup = {
	name: string;
	open: boolean;
	items: RegistryItem[];
};

const recentLimit = 8;

export function rememberRecent(recent: string[], key: string): string[] {
	return [key, ...recent.filter(item => item !== key)].slice(0, recentLimit);
}

export function togglePinned(pinned: string[], key: string): string[] {
	if (pinned.includes(key))
		return pinned.filter(item => item !== key);
	return [...pinned, key];
}

export function filterRegistry(items: RegistryItem[], query: string, scope: RegistryScope, pinned: string[], recent: string[]): RegistryItem[] {
	const q = query.trim().toLowerCase();
	return items.filter(item => {
		if (scope === 'pinned' && !pinned.includes(item.key))
			return false;
		if (scope === 'recent' && !recent.includes(item.key))
			return false;
		if (!q)
			return true;
		return `${item.name} ${item.description} ${item.group}`.toLowerCase().includes(q);
	});
}

export function groupRegistry(
	items: RegistryItem[],
	visible: RegistryItem[],
	groupBy: RegistryGroupBy,
	query: string,
	scope: RegistryScope,
	pinned: string[],
	recent: string[],
	collapsed: Record<string, boolean>,
): RegistryGroup[] {
	const visibleKeys = new Set(visible.map(item => item.key));
	const byKey = new Map(items.map(item => [item.key, item]));
	const groups: {name: string; items: RegistryItem[]}[] = [];

	if (groupBy === 'category') {
		const buckets = new Map<string, RegistryItem[]>();
		for (const item of items) {
			if (!visibleKeys.has(item.key))
				continue;
			const name = item.group || 'Other';
			const bucket = buckets.get(name) ?? [];
			bucket.push(item);
			buckets.set(name, bucket);
		}
		for (const [name, bucket] of buckets)
			groups.push({name, items: bucket});
	} else if (groupBy === 'az') {
		groups.push({
			name: 'All tools',
			items: visible.slice().sort((a, b) => a.name.localeCompare(b.name)),
		});
	} else {
		const used = recent.map(key => byKey.get(key)).filter((item): item is RegistryItem => !!item && visibleKeys.has(item.key));
		const usedKeys = new Set(used.map(item => item.key));
		const rest = visible.filter(item => !usedKeys.has(item.key));
		if (used.length)
			groups.push({name: 'Recently used', items: used});
		if (rest.length)
			groups.push({name: 'Not used yet', items: rest});
	}

	if (scope === 'all' && !query.trim() && groupBy === 'category' && pinned.length) {
		const pinnedItems = pinned.map(key => byKey.get(key)).filter((item): item is RegistryItem => !!item);
		if (pinnedItems.length)
			groups.unshift({name: 'Pinned', items: pinnedItems});
	}

	const forceOpen = query.trim().length > 0;
	return groups.filter(group => group.items.length > 0).map(group => ({
		name: group.name,
		items: group.items,
		open: forceOpen || !collapsed[group.name],
	}));
}

export function registryEmptyLabel(query: string, scope: RegistryScope): string {
	if (query.trim())
		return `No tools match "${query.trim()}".`;
	if (scope === 'pinned')
		return 'No pinned tools.';
	if (scope === 'recent')
		return 'No recent tools.';
	return 'No tools match.';
}
