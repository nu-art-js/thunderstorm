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
