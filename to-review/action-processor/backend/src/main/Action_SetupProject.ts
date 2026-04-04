/*
 * @nu-art/action-processor-backend - Setup project action and PerformProjectSetup contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ActionDeclaration} from './types.js';
import {BadImplementationException, Brand, Dispatcher, flatArray, Logger} from '@nu-art/ts-common';

export type SetupTaskKey = Brand<string, 'SetupTaskKey'>;

export const asSetupTaskKey = (key: string) => key as SetupTaskKey;

export type SetupTask = {
	key: SetupTaskKey;
	dependsOn: SetupTaskKey[];
	processor: () => Promise<void>;
};

export interface PerformProjectSetup {
	__performProjectSetup(): SetupTask[];
}

const dispatcher_ProjectSetup = new Dispatcher<PerformProjectSetup, '__performProjectSetup'>('__performProjectSetup');

const topoSortTasks = (tasks: SetupTask[]): SetupTask[][] => {
	const taskMap = new Map<SetupTaskKey, SetupTask>();
	const inDegree = new Map<SetupTaskKey, number>();
	const dependents = new Map<SetupTaskKey, SetupTaskKey[]>();

	for (const task of tasks) {
		if (taskMap.has(task.key))
			throw new BadImplementationException(`Duplicate SetupTaskKey: '${task.key}'`);

		taskMap.set(task.key, task);
		inDegree.set(task.key, 0);
		dependents.set(task.key, []);
	}

	for (const task of tasks) {
		for (const dep of task.dependsOn) {
			if (!taskMap.has(dep))
				throw new BadImplementationException(`SetupTask '${task.key}' depends on unknown key '${dep}'`);

			inDegree.set(task.key, inDegree.get(task.key)! + 1);
			dependents.get(dep)!.push(task.key);
		}
	}

	const levels: SetupTask[][] = [];
	let ready = tasks.filter(t => inDegree.get(t.key) === 0);
	let processed = 0;

	while (ready.length > 0) {
		levels.push(ready);
		processed += ready.length;

		const nextReady: SetupTask[] = [];
		for (const task of ready) {
			for (const depKey of dependents.get(task.key)!) {
				const newDegree = inDegree.get(depKey)! - 1;
				inDegree.set(depKey, newDegree);
				if (newDegree === 0)
					nextReady.push(taskMap.get(depKey)!);
			}
		}

		ready = nextReady;
	}

	if (processed !== tasks.length)
		throw new BadImplementationException(`Cycle detected in SetupTask dependency graph`);

	return levels;
};

const Action_SetupProject = async (logger: Logger) => {
	logger.logInfo('Setting up Project');
	const tasks = flatArray(dispatcher_ProjectSetup.dispatchModule());
	const levels = topoSortTasks(tasks);

	for (let i = 0; i < levels.length; i++) {
		const level = levels[i];
		const keys = level.map(t => t.key).join(', ');
		logger.logInfoBold(`SetupProject level ${i}: [${keys}]`);
		await Promise.all(level.map(task => task.processor()));
	}

	logger.logInfo('Project Setup Completed!');
};

const logger_SetupProject = new Logger('SetupProject');
export const runProjectSetup = () => Action_SetupProject(logger_SetupProject);

export const RAD_SetupProject: ActionDeclaration = {
	key: 'setup-project',
	group: 'Initialization',
	description: '...',
	processor: Action_SetupProject,
};
