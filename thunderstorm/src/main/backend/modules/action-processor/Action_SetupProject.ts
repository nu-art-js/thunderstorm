import {ActionDeclaration} from './types';
import {_keys, Dispatcher, Logger} from '@nu-art/ts-common';


export type SetupProjectPromise = { priority: number, processor: () => Promise<void> };

export interface PerformProjectSetup {
	__performProjectSetup(): SetupProjectPromise;
}

const dispatcher_ProjectSetup = new Dispatcher<PerformProjectSetup, '__performProjectSetup'>('__performProjectSetup');

type PromisesMap = { [priority: number]: { processors: (() => Promise<void>)[] } };
const Action_SetupProject = async (logger: Logger) => {
	logger.logInfo('Setting up Project');
	const promises = dispatcher_ProjectSetup.dispatchModule();
	const promiseMap = promises.reduce<PromisesMap>((resultMap, promise) => {
		resultMap[promise.priority] = resultMap[promise.priority] ?? {processors: []};
		resultMap[promise.priority].processors.push(promise.processor);

		return resultMap;
	}, {});

	const priorities = _keys(promiseMap).sort(); // Start with priority 0, as most important
	for (const priorityKey of priorities) {
		await Promise.all(promiseMap[priorityKey].processors);
	}

	logger.logInfo('Project Setup Completed!');
};

export const RAD_SetupProject: ActionDeclaration = {
	key: 'setup-project',
	group: 'Initialization',
	description: '...',
	processor: Action_SetupProject
};

