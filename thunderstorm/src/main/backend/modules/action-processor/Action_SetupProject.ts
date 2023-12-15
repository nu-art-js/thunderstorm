import {ActionDeclaration} from './types';
import {Dispatcher, Logger} from '@nu-art/ts-common';


export interface PerformProjectSetup {
	__performProjectSetup(): Promise<void>;
}

const dispatcher_ProjectSetup = new Dispatcher<PerformProjectSetup, '__performProjectSetup'>('__performProjectSetup');

const Action_SetupProject = async (logger: Logger) => {
	logger.logInfo('Setting up Project');
	await dispatcher_ProjectSetup.dispatchModuleAsync();
	logger.logInfo('Project Setup Completed!');
};

export const RAD_SetupProject: ActionDeclaration = {
	key: 'setup-project',
	group: 'Initialization',
	description: '...',
	processor: Action_SetupProject
};

