/*
 * @nu-art/action-processor-frontend - Dev Tools view model
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ActionMetaData} from '@nu-art/action-processor-shared';

export type DevToolsAction = ActionMetaData & {
	label?: string;
	destructive?: boolean;
};

export type DevToolsGroup = {
	name: string;
	items: DevToolsAction[];
};

export function actionTitle(action: DevToolsAction): string {
	const label = action.label?.trim();
	if (label)
		return label;

	return action.key;
}

export function errorText(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message.trim())
		return error.message;

	if (typeof error === 'string' && error.trim())
		return error.trim();

	return fallback;
}

export function formatClock(date: Date): string {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

/** Clock shown on the action. Example: lastRunLabel('14:02:11') is "Today 14:02:11". */
export function lastRunLabel(clock: string | undefined): string {
	if (!clock)
		return 'Not run in this session';

	return `Today ${clock}`;
}

/** Elapsed time for one log row. Example: formatDuration(1200) is "1.2 s". */
export function formatDuration(elapsedMs: number): string {
	const seconds = Math.max(0, elapsedMs) / 1000;
	if (seconds < 10)
		return `${seconds.toFixed(1)} s`;

	return `${Math.round(seconds)} s`;
}

/** localStorage key for the action that stays selected after a refresh. */
export const DevToolsSelectedActionKey = 'dev-tools.refactoring-actions.selected';

export type SelectionStore = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
};

export function browserSelectionStore(): SelectionStore | undefined {
	if (typeof window === 'undefined')
		return undefined;

	try {
		return window.localStorage;
	} catch {
		return undefined;
	}
}

export function readStoredSelection(store: SelectionStore | undefined): string | undefined {
	if (!store)
		return undefined;

	try {
		const value = store.getItem(DevToolsSelectedActionKey)?.trim();
		return value ? value : undefined;
	} catch {
		return undefined;
	}
}

export function writeStoredSelection(store: SelectionStore | undefined, key: string): void {
	const value = key.trim();
	if (!store || !value)
		return;

	try {
		store.setItem(DevToolsSelectedActionKey, value);
	} catch {
		// Private mode can reject storage. The open view still keeps the selection.
	}
}

export function clearStoredSelection(store: SelectionStore | undefined): void {
	if (!store)
		return;

	try {
		store.removeItem(DevToolsSelectedActionKey);
	} catch {
		// A rejected clear leaves the previous key. The next explicit choice overwrites it.
	}
}

/**
 * The stored action wins when it is still in the catalog.
 * A filter can hide that row. The detail keeps it.
 * Example: resolveSelectedAction(all, destructiveOnly, 'read-diagnostics') returns the read action.
 */
export function resolveSelectedAction(actions: DevToolsAction[], visible: DevToolsAction[], selectedKey: string | undefined): DevToolsAction | undefined {
	if (selectedKey) {
		const stored = actions.find(action => action.key === selectedKey);
		if (stored)
			return stored;
	}

	return visible[0];
}

export function filterDevToolsActions(actions: DevToolsAction[], query: string, destructiveOnly: boolean): DevToolsAction[] {
	const needle = query.trim().toLowerCase();
	return actions.filter(action => {
		if (destructiveOnly && action.destructive !== true)
			return false;

		if (!needle)
			return true;

		const haystack = `${actionTitle(action)} ${action.key} ${action.description} ${action.group}`.toLowerCase();
		return haystack.includes(needle);
	});
}

export function groupDevToolsActions(actions: DevToolsAction[]): DevToolsGroup[] {
	const order: string[] = [];
	const groups = new Map<string, DevToolsAction[]>();
	for (const action of actions) {
		const name = action.group.trim() || 'Other';
		const items = groups.get(name);
		if (!items) {
			groups.set(name, [action]);
			order.push(name);
			continue;
		}

		items.push(action);
	}

	return order.map(name => ({name, items: groups.get(name)!}));
}

export function confirmReady(action: DevToolsAction | undefined, confirm: string): boolean {
	if (!action?.destructive)
		return true;

	return confirm.trim() === actionTitle(action);
}

export function runEnabled(input: {canRun: boolean; running: boolean; action?: DevToolsAction; confirm: string}): boolean {
	if (!input.canRun || input.running || !input.action)
		return false;

	return confirmReady(input.action, input.confirm);
}
