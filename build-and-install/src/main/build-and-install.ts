import {DebugFlag, LogLevel, StaticLogger} from '@nu-art/ts-common';
import {RuntimeParams} from './core/params/params';
import {PhaseRunner} from './v2/phase-runner/PhaseRunner';
import {allPhases} from './v2/phase';

DebugFlag.DefaultLogLevel = RuntimeParams.debug ? LogLevel.Debug : LogLevel.Info;

const runner = new PhaseRunner(allPhases)
	.registerProject('./.config/project-config-v2.ts');

runner
	.execute()
	.then(() => {
		StaticLogger.logInfo('completed');
	})
	.catch(err => {
		StaticLogger.logError('Failed with error: ', err);
	});

// const projectManager = new ProjectManager();
//
// projectManager.registerPhase(Phase_CompileWatch);
//
// projectManager.execute()
// 	.then(() => {
// 		StaticLogger.logInfo('completed');
// 	})
// 	.catch(err => {
// 		StaticLogger.logError('Failed with error: ', err);
// 	});

