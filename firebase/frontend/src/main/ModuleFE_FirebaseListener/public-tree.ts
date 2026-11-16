/**
 * One /public snapshot, many inner listeners.
 * A listener path is relative to /public.
 * Example: listen('state/ModuleBE_SyncManager/syncData/orders', onOrders)
 */

export type PublicTreeListener = (value: unknown, previous: unknown) => void;

type PublicListenerEntry = {
	path: string;
	onChange: PublicTreeListener;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Deep equality for plain RTDB values. Arrays stay leaves. */
export const samePublicValue = (left: unknown, right: unknown): boolean => {
	if (Object.is(left, right))
		return true;
	if (Array.isArray(left) && Array.isArray(right))
		return left.length === right.length && left.every((item, index) => samePublicValue(item, right[index]));
	if (!isRecord(left) || !isRecord(right))
		return false;

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length)
		return false;
	return leftKeys.every(key => samePublicValue(left[key], right[key]));
};

/** Strip slashes. Example: normalizePublicPath('/a/b/') === 'a/b'. '' is the /public root. */
export const normalizePublicPath = (path: string): string => {
	const trimmed = path.replace(/^\/+|\/+$/g, '');
	if (trimmed.split('/').includes(''))
		throw new Error(`Public path has an empty segment: ${path}`);
	return trimmed;
};

/**
 * A parent hears a deeper change. A child hears a parent replace.
 * Example: publicPathMatches('a/b', 'a/b/c/d') === true
 */
export const publicPathMatches = (listenerPath: string, changedPath: string): boolean => {
	if (listenerPath === '' || changedPath === '')
		return true;
	return listenerPath === changedPath
		|| changedPath.startsWith(`${listenerPath}/`)
		|| listenerPath.startsWith(`${changedPath}/`);
};

/** Value at a relative path. A missing node is undefined. Example: publicValueAt({a:{b:1}}, 'a/b') === 1 */
export const publicValueAt = (tree: unknown, path: string): unknown => {
	const normal = normalizePublicPath(path);
	if (normal === '')
		return tree;

	let cursor: unknown = tree;
	for (const key of normal.split('/')) {
		if (!isRecord(cursor) || !Object.prototype.hasOwnProperty.call(cursor, key))
			return undefined;
		cursor = cursor[key];
	}
	return cursor;
};

/**
 * Paths whose leaf or object differs.
 * Example: reducePublicChange({a:{b:1}}, {a:{b:2}}) => ['a/b']
 */
export const reducePublicChange = (previous: unknown, next: unknown, prefix = ''): string[] => {
	if (samePublicValue(previous, next))
		return [];
	if (isRecord(previous) && isRecord(next)) {
		const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
		const paths: string[] = [];
		for (const key of keys) {
			const child = prefix === '' ? key : `${prefix}/${key}`;
			paths.push(...reducePublicChange(previous[key], next[key], child));
		}
		return paths;
	}
	return [prefix];
};

/**
 * Holds the last /public tree.
 * The first apply seeds and emits nothing.
 * A later apply calls each listener whose slice changed, once.
 * listen() after the seed replays the current slice once. previous is undefined on that replay.
 */
export class PublicTreeListeners {
	private tree: unknown;
	private seeded = false;
	private listeners: PublicListenerEntry[] = [];

	listen(path: string, onChange: PublicTreeListener): () => void {
		const normal = normalizePublicPath(path);
		if (this.seeded)
			onChange(publicValueAt(this.tree, normal), undefined);

		const entry: PublicListenerEntry = {path: normal, onChange};
		this.listeners.push(entry);
		return () => {
			const index = this.listeners.indexOf(entry);
			if (index >= 0)
				this.listeners.splice(index, 1);
		};
	}

	apply(next: unknown): void {
		if (!this.seeded) {
			this.tree = next;
			this.seeded = true;
			return;
		}

		const previous = this.tree;
		const changed = reducePublicChange(previous, next);
		this.tree = next;
		for (const listener of [...this.listeners]) {
			if (!changed.some(changedPath => publicPathMatches(listener.path, changedPath)))
				continue;

			const nextValue = publicValueAt(next, listener.path);
			const previousValue = publicValueAt(previous, listener.path);
			if (samePublicValue(previousValue, nextValue))
				continue;
			listener.onChange(nextValue, previousValue);
		}
	}
}
