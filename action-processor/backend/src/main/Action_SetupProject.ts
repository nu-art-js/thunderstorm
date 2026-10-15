/*
 * @nu-art/action-processor-backend - Setup project action and the project setup action graph
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ActionDeclaration} from './types.js';
import {GraphDispatcher, Logger, type DispatchKey} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';

export interface OnProjectSetupAction {
	__onProjectSetupAction(): Promise<void>;
}

/**
 * The shared project-setup action graph. Packages register actions with @OnDispatch(graph_ProjectSetup,
 * {key, runAfter}), depending on other packages' action keys. Nodes bind by key (any method name).
 */
export const graph_ProjectSetup = new GraphDispatcher<OnProjectSetupAction, '__onProjectSetupAction'>('__onProjectSetupAction', {bindByKey: true});

const projectSetupRoots: DispatchKey[] = [];

/**
 * The app's root setup action(s). Project setup runs only these and their transitive dependencies.
 * An action nothing reaches never runs. Replaces previous roots.
 */
export const setProjectSetupRoots = (...roots: DispatchKey[]) => {
	projectSetupRoots.splice(0, projectSetupRoots.length, ...roots);
};

/** Whether the app's setup roots reach an action (runtime features gate on the setup they rely on). */
export const projectSetupReaches = (key: DispatchKey): boolean => graph_ProjectSetup.reaches(projectSetupRoots, key);

const Action_SetupProject = async (logger: Logger) => {
	return new MemStorage().init(async () => {
		logger.logInfo('Setting up Project');
		if (!projectSetupRoots.length)
			logger.logWarning('No project setup roots: nothing to run (setProjectSetupRoots)');
		else {
			logger.logInfoBold(`SetupProject actions from: [${projectSetupRoots.join(', ')}]`);
			await graph_ProjectSetup.dispatchFrom(projectSetupRoots);
		}

		logger.logInfo('Project Setup Completed!');
	});
};

const logger_SetupProject = new Logger('SetupProject');
export const runProjectSetup = () => Action_SetupProject(logger_SetupProject);

export const RAD_SetupProject: ActionDeclaration = {
	key: 'setup-project',
	group: 'Initialization',
	description: '...',
	processor: Action_SetupProject,
};
